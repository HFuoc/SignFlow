from __future__ import annotations

import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from app.desktop_collector.auth import (
    AuthService,
    AuthenticationError,
    InvalidCredentials,
    SessionInvalid,
)
from app.desktop_collector.persistence import (
    IdentityRepository,
    PersistenceConflict,
    PersistenceStartupError,
    canonicalize_username,
)


ADMIN_PASSWORD = "correct horse battery staple"
SECOND_PASSWORD = "another long passphrase with spaces"


class MutableClock:
    def __init__(self) -> None:
        self.value = datetime(2026, 9, 4, 12, 0, tzinfo=UTC)

    def __call__(self) -> datetime:
        return self.value

    def advance(self, delta: timedelta) -> None:
        self.value += delta


@pytest.fixture
def identity(tmp_path: Path) -> tuple[IdentityRepository, AuthService, MutableClock]:
    repository = IdentityRepository(tmp_path / "identity.sqlite3")
    clock = MutableClock()
    service = AuthService(repository, clock=clock)
    try:
        yield repository, service, clock
    finally:
        repository.close()


def setup_admin(service: AuthService):  # type: ignore[no-untyped-def]
    return service.bootstrap_administrator(
        username="Administrator",
        display_name="Local owner",
        password=ADMIN_PASSWORD,
        password_confirmation=ADMIN_PASSWORD,
    )


def test_clean_migration_is_idempotent_and_persists_across_restart(tmp_path: Path) -> None:
    path = tmp_path / "restart" / "identity.sqlite3"
    first = IdentityRepository(path)
    assert first.schema_versions() == (1,)
    assert first.foreign_keys_enabled()
    assert first.journal_mode() == "wal"
    service = AuthService(first)
    setup_admin(service)
    first.migrate()
    assert first.schema_versions() == (1,)
    first.close()

    second = IdentityRepository(path)
    try:
        assert second.schema_versions() == (1,)
        assert second.user_count() == 1
        assert second.find_user_by_username("ADMINISTRATOR") is not None
    finally:
        second.close()


def test_database_path_inside_repository_is_rejected() -> None:
    repository_root = Path(__file__).resolve().parents[1]
    with pytest.raises(PersistenceStartupError, match="outside the repository"):
        IdentityRepository(repository_root / "data" / "local" / "forbidden.sqlite3")


def test_foreign_keys_and_transaction_rollback(identity) -> None:  # type: ignore[no-untyped-def]
    repository, _, _ = identity
    with pytest.raises(sqlite3.IntegrityError):
        repository.execute_transaction_for_testing(
            [
                (
                    "INSERT INTO user_sessions "
                    "(id,token_hash,user_id,credential_version,created_at,last_seen_at,"
                    "absolute_expires_at,idle_expires_at) VALUES (?,?,?,?,?,?,?,?)",
                    ("s", "h", "missing", 1, "n", "n", "x", "x"),
                )
            ]
        )
    with pytest.raises(sqlite3.IntegrityError):
        repository.execute_transaction_for_testing(
            [
                (
                    "INSERT INTO users "
                    "(id,username,password_hash,role,is_active,must_change_password,"
                    "failed_login_count,credential_version,created_at,updated_at) "
                    "VALUES (?,?,?,?,1,0,0,1,?,?)",
                    ("rollback-user", "rollback", "not-plain", "researcher", "n", "n"),
                ),
                (
                    "INSERT INTO audit_events "
                    "(id,event_type,outcome,occurred_at,metadata_json) VALUES (?,?,?,?,?)",
                    ("bad-audit", "test", "invalid-outcome", "n", "{}"),
                ),
            ]
        )
    assert repository.find_user_by_username("rollback") is None


def test_canonical_username_is_unique_and_password_is_argon2id(identity) -> None:  # type: ignore[no-untyped-def]
    repository, service, _ = identity
    issued = setup_admin(service)
    assert canonicalize_username("  ADMINISTRATOR  ") == "administrator"
    stored = repository.get_user(issued.principal.user.id)
    assert stored is not None
    assert stored.password_hash != ADMIN_PASSWORD
    assert stored.password_hash.startswith("$argon2id$v=19$m=19456,t=2,p=1$")
    service.create_user(
        issued.principal,
        username="Research.User",
        display_name="Research user",
        password=SECOND_PASSWORD,
        role="researcher",
    )
    with pytest.raises(AuthenticationError) as duplicate:
        service.create_user(
            issued.principal,
            username="RESEARCH.USER",
            display_name=None,
            password=SECOND_PASSWORD,
            role="researcher",
        )
    assert duplicate.value.status_code == 409
    assert len(repository.list_users()) == 2


def test_atomic_bootstrap_creates_exactly_one_administrator(tmp_path: Path) -> None:
    repository = IdentityRepository(tmp_path / "atomic.sqlite3")
    service = AuthService(repository)

    def attempt(index: int) -> str:
        try:
            service.bootstrap_administrator(
                username=f"admin{index}",
                display_name=None,
                password=ADMIN_PASSWORD,
                password_confirmation=ADMIN_PASSWORD,
            )
            return "created"
        except AuthenticationError:
            return "rejected"

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(attempt, (1, 2)))
        assert sorted(results) == ["created", "rejected"]
        users = repository.list_users()
        assert len(users) == 1
        assert users[0].role == "administrator"
    finally:
        repository.close()


def test_invalid_user_and_password_have_indistinguishable_public_failure(identity) -> None:  # type: ignore[no-untyped-def]
    _, service, _ = identity
    setup_admin(service)
    failures = []
    for username, password in (
        ("missing", ADMIN_PASSWORD),
        ("administrator", "this passphrase is wrong"),
    ):
        with pytest.raises(InvalidCredentials) as failure:
            service.login(username=username, password=password)
        failures.append((failure.value.status_code, failure.value.code, failure.value.public_message))
    assert failures[0] == failures[1]


def test_login_backoff_is_account_bound_and_eventually_allows_success(identity) -> None:  # type: ignore[no-untyped-def]
    repository, service, clock = identity
    setup_admin(service)
    for _ in range(5):
        with pytest.raises(InvalidCredentials):
            service.login(username="administrator", password="wrong but sufficiently long")
    user = repository.find_user_by_username("administrator")
    assert user is not None
    assert user.failed_login_count == 5
    assert user.backoff_until is not None
    with pytest.raises(InvalidCredentials):
        service.login(username="administrator", password=ADMIN_PASSWORD)
    clock.advance(timedelta(seconds=2))
    issued = service.login(username="administrator", password=ADMIN_PASSWORD)
    assert issued.principal.user.id == user.id


def test_logout_idle_expiry_and_password_change_revoke_sessions(identity) -> None:  # type: ignore[no-untyped-def]
    _, service, clock = identity
    first = setup_admin(service)
    service.validate_session(first.credential)
    assert service.logout(first.credential) == first.principal.session.id
    with pytest.raises(SessionInvalid):
        service.validate_session(first.credential)

    login = service.login(username="administrator", password=ADMIN_PASSWORD)
    second_login = service.login(username="administrator", password=ADMIN_PASSWORD)
    assert second_login.credential != login.credential
    assert second_login.principal.session.id != login.principal.session.id
    clock.advance(timedelta(minutes=31))
    with pytest.raises(SessionInvalid):
        service.validate_session(login.credential)

    login = service.login(username="administrator", password=ADMIN_PASSWORD)
    rotated = service.change_password(
        login.principal,
        current_password=ADMIN_PASSWORD,
        new_password=SECOND_PASSWORD,
        new_password_confirmation=SECOND_PASSWORD,
    )
    with pytest.raises(SessionInvalid):
        service.validate_session(login.credential)
    assert service.validate_session(rotated.credential).user.must_change_password is False

    absolute = service.login(username="administrator", password=SECOND_PASSWORD)
    clock.advance(timedelta(hours=8, seconds=1))
    with pytest.raises(SessionInvalid):
        service.validate_session(absolute.credential)


def test_role_or_activation_change_revokes_sessions_and_protects_final_admin(identity) -> None:  # type: ignore[no-untyped-def]
    repository, service, _ = identity
    admin = setup_admin(service)
    researcher = service.create_user(
        admin.principal,
        username="researcher",
        display_name=None,
        password=SECOND_PASSWORD,
        role="researcher",
    )
    researcher_session = service.login(username="researcher", password=SECOND_PASSWORD)
    updated, revoked = service.update_user(
        admin.principal,
        target_user_id=researcher.id,
        display_name=None,
        role="developer",
        is_active=True,
    )
    assert updated.role == "developer"
    assert researcher_session.principal.session.id in revoked
    with pytest.raises(SessionInvalid):
        service.validate_session(researcher_session.credential)

    disabled, _ = service.update_user(
        admin.principal,
        target_user_id=researcher.id,
        display_name=None,
        role="developer",
        is_active=False,
    )
    assert disabled.is_active is False
    with pytest.raises(InvalidCredentials):
        service.login(username="researcher", password=SECOND_PASSWORD)

    with pytest.raises(AuthenticationError) as protected:
        service.update_user(
            admin.principal,
            target_user_id=admin.principal.user.id,
            display_name=admin.principal.user.display_name,
            role="researcher",
            is_active=True,
        )
    assert protected.value.status_code == 409
    assert repository.get_user(admin.principal.user.id).role == "administrator"  # type: ignore[union-attr]


def test_audit_records_required_events_without_credentials(identity) -> None:  # type: ignore[no-untyped-def]
    repository, service, _ = identity
    admin = setup_admin(service)
    user = service.create_user(
        admin.principal,
        username="participant",
        display_name="Participant",
        password=SECOND_PASSWORD,
        role="participant",
    )
    service.reset_password(
        admin.principal,
        target_user_id=user.id,
        temporary_password="temporary passphrase value",
    )
    service.record_denied(admin.principal, action="DELETE", path="/api/v1/admin/example")
    events = repository.list_audit_events(limit=100)
    event_types = {event.event_type for event in events}
    assert {
        "bootstrap_administrator_created",
        "user_created",
        "password_reset",
        "privileged_action_denied",
    }.issubset(event_types)
    serialized = repr(events)
    assert ADMIN_PASSWORD not in serialized
    assert SECOND_PASSWORD not in serialized
    assert admin.credential not in serialized
