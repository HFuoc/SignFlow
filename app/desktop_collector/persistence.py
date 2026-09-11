"""Small explicit SQLite persistence boundary for local product identity data."""

from __future__ import annotations

import json
import os
import sqlite3
import sys
import threading
import unicodedata
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator, Mapping, Sequence


DATABASE_FILENAME = "smartglove.sqlite3"
CURRENT_SCHEMA_VERSION = 1
ROLE_VALUES = ("participant", "researcher", "administrator", "developer")


class PersistenceError(RuntimeError):
    """Base persistence failure whose message is safe to retain internally."""


class PersistenceStartupError(PersistenceError):
    """Database could not be initialized safely."""


class PersistenceConflict(PersistenceError):
    """A requested write conflicts with an existing or protected record."""


@dataclass(frozen=True)
class UserRecord:
    id: str
    username: str
    display_name: str | None
    password_hash: str
    role: str
    is_active: bool
    must_change_password: bool
    failed_login_count: int
    backoff_until: str | None
    credential_version: int
    created_at: str
    updated_at: str
    last_login_at: str | None


@dataclass(frozen=True)
class SessionRecord:
    id: str
    user_id: str
    credential_version: int
    created_at: str
    last_seen_at: str
    absolute_expires_at: str
    idle_expires_at: str
    revoked_at: str | None
    revoked_reason: str | None


@dataclass(frozen=True)
class AuditRecord:
    id: str
    event_type: str
    actor_user_id: str | None
    target_user_id: str | None
    outcome: str
    occurred_at: str
    metadata: Mapping[str, Any]


def canonicalize_username(value: str) -> str:
    """Return the one persisted username representation used by every layer."""

    return unicodedata.normalize("NFKC", value).strip().casefold()


def application_user_data_dir() -> Path:
    """Resolve a platform user-data directory without adding a runtime dependency."""

    override = os.environ.get("SMARTGLOVE_USER_DATA_DIR")
    if override:
        return Path(override).expanduser().resolve()
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA")
        if base:
            return Path(base).expanduser().resolve() / "SmartGlove Dataset Studio"
        return Path.home() / "AppData" / "Local" / "SmartGlove Dataset Studio"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "SmartGlove Dataset Studio"
    base = os.environ.get("XDG_DATA_HOME")
    return (
        Path(base).expanduser().resolve() / "smartglove-dataset-studio"
        if base
        else Path.home() / ".local" / "share" / "smartglove-dataset-studio"
    )


def default_database_path() -> Path:
    return application_user_data_dir() / DATABASE_FILENAME


def _repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


def ensure_outside_repository(path: Path, repository_root: Path | None = None) -> Path:
    """Reject runtime identity databases placed anywhere inside the source tree."""

    resolved = path.expanduser().resolve()
    root = (repository_root or _repository_root()).resolve()
    if resolved == root or resolved.is_relative_to(root):
        raise PersistenceStartupError("Local account storage must be outside the repository.")
    return resolved


MIGRATIONS: dict[int, tuple[str, ...]] = {
    1: (
        """
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('participant','researcher','administrator','developer')),
            is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
            must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0,1)),
            failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
            backoff_until TEXT,
            credential_version INTEGER NOT NULL DEFAULT 1 CHECK (credential_version >= 1),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_login_at TEXT
        )
        """,
        """
        CREATE TABLE user_sessions (
            id TEXT PRIMARY KEY,
            token_hash TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            credential_version INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            absolute_expires_at TEXT NOT NULL,
            idle_expires_at TEXT NOT NULL,
            revoked_at TEXT,
            revoked_reason TEXT
        )
        """,
        "CREATE INDEX user_sessions_user_id_idx ON user_sessions(user_id)",
        "CREATE INDEX user_sessions_token_hash_idx ON user_sessions(token_hash)",
        """
        CREATE TABLE audit_events (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            outcome TEXT NOT NULL CHECK (outcome IN ('success','failure','denied')),
            occurred_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        )
        """,
        "CREATE INDEX audit_events_occurred_at_idx ON audit_events(occurred_at DESC)",
    ),
}


class IdentityRepository:
    """Own SQLite lifecycle and all SQL used by authentication services."""

    def __init__(self, database_path: Path | None = None) -> None:
        self.path = ensure_outside_repository(database_path or default_database_path())
        self.path.parent.mkdir(parents=True, exist_ok=True)
        try:
            if os.name != "nt":
                self.path.parent.chmod(0o700)
            self._connection = sqlite3.connect(
                self.path,
                isolation_level=None,
                check_same_thread=False,
                timeout=5.0,
            )
            self._connection.row_factory = sqlite3.Row
            self._lock = threading.RLock()
            self._configure()
            self.migrate()
        except (OSError, sqlite3.Error) as error:
            connection = getattr(self, "_connection", None)
            if connection is not None:
                connection.close()
            raise PersistenceStartupError("Local account storage could not be initialized.") from error

    def _configure(self) -> None:
        with self._lock:
            self._connection.execute("PRAGMA foreign_keys = ON")
            self._connection.execute("PRAGMA busy_timeout = 5000")
            self._connection.execute("PRAGMA journal_mode = WAL")
            self._connection.execute("PRAGMA synchronous = NORMAL")

    @contextmanager
    def transaction(self, *, immediate: bool = False) -> Iterator[sqlite3.Connection]:
        with self._lock:
            self._connection.execute("BEGIN IMMEDIATE" if immediate else "BEGIN")
            try:
                yield self._connection
            except Exception:
                self._connection.rollback()
                raise
            else:
                self._connection.commit()

    def migrate(self) -> None:
        """Apply deterministic migrations exactly once inside an immediate transaction."""

        try:
            with self.transaction(immediate=True) as connection:
                connection.execute(
                    "CREATE TABLE IF NOT EXISTS schema_versions "
                    "(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)"
                )
                rows = connection.execute(
                    "SELECT version FROM schema_versions ORDER BY version"
                ).fetchall()
                applied = {int(row["version"]) for row in rows}
                unknown = applied.difference(MIGRATIONS)
                if unknown:
                    raise PersistenceStartupError("Local account storage schema is unsupported.")
                for version in range(1, CURRENT_SCHEMA_VERSION + 1):
                    if version in applied:
                        continue
                    for statement in MIGRATIONS[version]:
                        connection.execute(statement)
                    connection.execute(
                        "INSERT INTO schema_versions(version, applied_at) "
                        "VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
                        (version,),
                    )
        except sqlite3.Error as error:
            raise PersistenceStartupError("Local account storage migration failed.") from error

    def close(self) -> None:
        with self._lock:
            connection = getattr(self, "_connection", None)
            if connection is None:
                return
            try:
                connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            finally:
                connection.close()
                self._connection = None  # type: ignore[assignment]

    def schema_versions(self) -> tuple[int, ...]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT version FROM schema_versions ORDER BY version"
            ).fetchall()
        return tuple(int(row["version"]) for row in rows)

    def journal_mode(self) -> str:
        with self._lock:
            row = self._connection.execute("PRAGMA journal_mode").fetchone()
        return str(row[0]).lower()

    def foreign_keys_enabled(self) -> bool:
        with self._lock:
            row = self._connection.execute("PRAGMA foreign_keys").fetchone()
        return bool(row[0])

    @staticmethod
    def _user(row: sqlite3.Row | None) -> UserRecord | None:
        if row is None:
            return None
        return UserRecord(
            id=str(row["id"]),
            username=str(row["username"]),
            display_name=row["display_name"],
            password_hash=str(row["password_hash"]),
            role=str(row["role"]),
            is_active=bool(row["is_active"]),
            must_change_password=bool(row["must_change_password"]),
            failed_login_count=int(row["failed_login_count"]),
            backoff_until=row["backoff_until"],
            credential_version=int(row["credential_version"]),
            created_at=str(row["created_at"]),
            updated_at=str(row["updated_at"]),
            last_login_at=row["last_login_at"],
        )

    def user_count(self) -> int:
        with self._lock:
            row = self._connection.execute("SELECT COUNT(*) FROM users").fetchone()
        return int(row[0])

    def find_user_by_username(self, username: str) -> UserRecord | None:
        canonical = canonicalize_username(username)
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM users WHERE username = ?", (canonical,)
            ).fetchone()
        return self._user(row)

    def get_user(self, user_id: str) -> UserRecord | None:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM users WHERE id = ?", (user_id,)
            ).fetchone()
        return self._user(row)

    def list_users(self) -> tuple[UserRecord, ...]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM users ORDER BY username"
            ).fetchall()
        return tuple(self._user(row) for row in rows if row is not None)  # type: ignore[misc]

    @staticmethod
    def _insert_audit(
        connection: sqlite3.Connection,
        *,
        event_type: str,
        actor_user_id: str | None,
        target_user_id: str | None,
        outcome: str,
        occurred_at: str,
        metadata: Mapping[str, Any] | None = None,
    ) -> None:
        connection.execute(
            "INSERT INTO audit_events "
            "(id,event_type,actor_user_id,target_user_id,outcome,occurred_at,metadata_json) "
            "VALUES (?,?,?,?,?,?,?)",
            (
                uuid.uuid4().hex,
                event_type,
                actor_user_id,
                target_user_id,
                outcome,
                occurred_at,
                json.dumps(metadata or {}, ensure_ascii=False, separators=(",", ":")),
            ),
        )

    @staticmethod
    def _insert_session(
        connection: sqlite3.Connection,
        *,
        session_id: str,
        token_hash: str,
        user_id: str,
        credential_version: int,
        created_at: str,
        absolute_expires_at: str,
        idle_expires_at: str,
    ) -> None:
        connection.execute(
            "INSERT INTO user_sessions "
            "(id,token_hash,user_id,credential_version,created_at,last_seen_at,"
            "absolute_expires_at,idle_expires_at) VALUES (?,?,?,?,?,?,?,?)",
            (
                session_id,
                token_hash,
                user_id,
                credential_version,
                created_at,
                created_at,
                absolute_expires_at,
                idle_expires_at,
            ),
        )

    def bootstrap_administrator(
        self,
        *,
        username: str,
        display_name: str | None,
        password_hash: str,
        session_id: str,
        session_token_hash: str,
        now: str,
        absolute_expires_at: str,
        idle_expires_at: str,
    ) -> UserRecord:
        user_id = uuid.uuid4().hex
        try:
            with self.transaction(immediate=True) as connection:
                count = int(connection.execute("SELECT COUNT(*) FROM users").fetchone()[0])
                if count:
                    raise PersistenceConflict("Initial setup is no longer available.")
                connection.execute(
                    "INSERT INTO users "
                    "(id,username,display_name,password_hash,role,is_active,"
                    "must_change_password,created_at,updated_at) "
                    "VALUES (?,?,?,?, 'administrator',1,0,?,?)",
                    (user_id, username, display_name, password_hash, now, now),
                )
                self._insert_session(
                    connection,
                    session_id=session_id,
                    token_hash=session_token_hash,
                    user_id=user_id,
                    credential_version=1,
                    created_at=now,
                    absolute_expires_at=absolute_expires_at,
                    idle_expires_at=idle_expires_at,
                )
                self._insert_audit(
                    connection,
                    event_type="bootstrap_administrator_created",
                    actor_user_id=user_id,
                    target_user_id=user_id,
                    outcome="success",
                    occurred_at=now,
                )
        except sqlite3.IntegrityError as error:
            raise PersistenceConflict("Initial administrator could not be created.") from error
        user = self.get_user(user_id)
        if user is None:
            raise PersistenceError("Initial administrator was not persisted.")
        return user

    def create_user(
        self,
        *,
        username: str,
        display_name: str | None,
        password_hash: str,
        role: str,
        actor_user_id: str,
        now: str,
    ) -> UserRecord:
        user_id = uuid.uuid4().hex
        try:
            with self.transaction(immediate=True) as connection:
                connection.execute(
                    "INSERT INTO users "
                    "(id,username,display_name,password_hash,role,is_active,"
                    "must_change_password,created_at,updated_at) "
                    "VALUES (?,?,?,?,?,1,1,?,?)",
                    (user_id, username, display_name, password_hash, role, now, now),
                )
                self._insert_audit(
                    connection,
                    event_type="user_created",
                    actor_user_id=actor_user_id,
                    target_user_id=user_id,
                    outcome="success",
                    occurred_at=now,
                    metadata={"role": role},
                )
        except sqlite3.IntegrityError as error:
            raise PersistenceConflict("Username is already in use.") from error
        user = self.get_user(user_id)
        if user is None:
            raise PersistenceError("User was not persisted.")
        return user

    def record_login_failure(
        self,
        *,
        user_id: str | None,
        failed_login_count: int | None,
        backoff_until: str | None,
        now: str,
        reason: str,
    ) -> None:
        with self.transaction(immediate=True) as connection:
            if user_id is not None and failed_login_count is not None:
                connection.execute(
                    "UPDATE users SET failed_login_count=?,backoff_until=?,updated_at=? "
                    "WHERE id=?",
                    (failed_login_count, backoff_until, now, user_id),
                )
            self._insert_audit(
                connection,
                event_type="login_failed",
                actor_user_id=user_id,
                target_user_id=user_id,
                outcome="failure",
                occurred_at=now,
                metadata={"reason": reason},
            )

    def complete_login(
        self,
        *,
        user: UserRecord,
        session_id: str,
        session_token_hash: str,
        now: str,
        absolute_expires_at: str,
        idle_expires_at: str,
        replacement_password_hash: str | None = None,
    ) -> None:
        with self.transaction(immediate=True) as connection:
            connection.execute(
                "UPDATE users SET failed_login_count=0,backoff_until=NULL,last_login_at=?,"
                "updated_at=?,password_hash=COALESCE(?,password_hash) WHERE id=?",
                (now, now, replacement_password_hash, user.id),
            )
            self._insert_session(
                connection,
                session_id=session_id,
                token_hash=session_token_hash,
                user_id=user.id,
                credential_version=user.credential_version,
                created_at=now,
                absolute_expires_at=absolute_expires_at,
                idle_expires_at=idle_expires_at,
            )
            self._insert_audit(
                connection,
                event_type="login_succeeded",
                actor_user_id=user.id,
                target_user_id=user.id,
                outcome="success",
                occurred_at=now,
            )

    def find_session(self, token_hash: str) -> tuple[SessionRecord, UserRecord] | None:
        with self._lock:
            row = self._connection.execute(
                "SELECT s.id AS session_id,s.user_id AS session_user_id,"
                "s.credential_version AS session_credential_version,s.created_at AS session_created_at,"
                "s.last_seen_at,s.absolute_expires_at,s.idle_expires_at,s.revoked_at,s.revoked_reason,"
                "u.* FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?",
                (token_hash,),
            ).fetchone()
        if row is None:
            return None
        session = SessionRecord(
            id=str(row["session_id"]),
            user_id=str(row["session_user_id"]),
            credential_version=int(row["session_credential_version"]),
            created_at=str(row["session_created_at"]),
            last_seen_at=str(row["last_seen_at"]),
            absolute_expires_at=str(row["absolute_expires_at"]),
            idle_expires_at=str(row["idle_expires_at"]),
            revoked_at=row["revoked_at"],
            revoked_reason=row["revoked_reason"],
        )
        return session, self._user(row)  # type: ignore[return-value]

    def touch_session(self, session_id: str, *, last_seen_at: str, idle_expires_at: str) -> None:
        with self.transaction() as connection:
            connection.execute(
                "UPDATE user_sessions SET last_seen_at=?,idle_expires_at=? "
                "WHERE id=? AND revoked_at IS NULL",
                (last_seen_at, idle_expires_at, session_id),
            )

    def revoke_session_by_token(
        self,
        token_hash: str,
        *,
        now: str,
        reason: str,
        audit: bool = True,
    ) -> str | None:
        with self.transaction(immediate=True) as connection:
            row = connection.execute(
                "SELECT id,user_id FROM user_sessions WHERE token_hash=? AND revoked_at IS NULL",
                (token_hash,),
            ).fetchone()
            if row is None:
                return None
            connection.execute(
                "UPDATE user_sessions SET revoked_at=?,revoked_reason=? WHERE id=?",
                (now, reason, row["id"]),
            )
            if audit:
                self._insert_audit(
                    connection,
                    event_type="logout" if reason == "logout" else "session_revoked",
                    actor_user_id=str(row["user_id"]),
                    target_user_id=str(row["user_id"]),
                    outcome="success",
                    occurred_at=now,
                    metadata={"reason": reason},
                )
            return str(row["id"])

    def revoke_user_sessions(
        self,
        user_id: str,
        *,
        actor_user_id: str,
        now: str,
        reason: str,
        audit: bool = True,
    ) -> tuple[str, ...]:
        with self.transaction(immediate=True) as connection:
            rows = connection.execute(
                "SELECT id FROM user_sessions WHERE user_id=? AND revoked_at IS NULL",
                (user_id,),
            ).fetchall()
            ids = tuple(str(row["id"]) for row in rows)
            connection.execute(
                "UPDATE user_sessions SET revoked_at=?,revoked_reason=? "
                "WHERE user_id=? AND revoked_at IS NULL",
                (now, reason, user_id),
            )
            if audit:
                self._insert_audit(
                    connection,
                    event_type="session_revoked",
                    actor_user_id=actor_user_id,
                    target_user_id=user_id,
                    outcome="success",
                    occurred_at=now,
                    metadata={"reason": reason, "session_count": len(ids)},
                )
            return ids

    def update_user_by_administrator(
        self,
        *,
        target_user_id: str,
        actor_user_id: str,
        display_name: str | None,
        role: str | None,
        is_active: bool | None,
        now: str,
    ) -> tuple[UserRecord, tuple[str, ...]]:
        revoked_ids: tuple[str, ...] = ()
        with self.transaction(immediate=True) as connection:
            row = connection.execute("SELECT * FROM users WHERE id=?", (target_user_id,)).fetchone()
            current = self._user(row)
            if current is None:
                raise PersistenceConflict("User does not exist.")
            next_role = role if role is not None else current.role
            next_active = is_active if is_active is not None else current.is_active
            removes_admin = current.role == "administrator" and current.is_active and (
                next_role != "administrator" or not next_active
            )
            if removes_admin:
                remaining = int(connection.execute(
                    "SELECT COUNT(*) FROM users WHERE role='administrator' AND is_active=1 AND id<>?",
                    (target_user_id,),
                ).fetchone()[0])
                if remaining == 0:
                    raise PersistenceConflict("The final active administrator is protected.")
            material_change = next_role != current.role or next_active != current.is_active
            credential_version = current.credential_version + (1 if material_change else 0)
            connection.execute(
                "UPDATE users SET display_name=?,role=?,is_active=?,credential_version=?,updated_at=? "
                "WHERE id=?",
                (display_name, next_role, int(next_active), credential_version, now, target_user_id),
            )
            if next_role != current.role:
                self._insert_audit(
                    connection,
                    event_type="role_changed",
                    actor_user_id=actor_user_id,
                    target_user_id=target_user_id,
                    outcome="success",
                    occurred_at=now,
                    metadata={"from": current.role, "to": next_role},
                )
            if next_active != current.is_active:
                self._insert_audit(
                    connection,
                    event_type="account_activated" if next_active else "account_deactivated",
                    actor_user_id=actor_user_id,
                    target_user_id=target_user_id,
                    outcome="success",
                    occurred_at=now,
                )
            if material_change:
                session_rows = connection.execute(
                    "SELECT id FROM user_sessions WHERE user_id=? AND revoked_at IS NULL",
                    (target_user_id,),
                ).fetchall()
                revoked_ids = tuple(str(item["id"]) for item in session_rows)
                connection.execute(
                    "UPDATE user_sessions SET revoked_at=?,revoked_reason='account_changed' "
                    "WHERE user_id=? AND revoked_at IS NULL",
                    (now, target_user_id),
                )
        updated = self.get_user(target_user_id)
        if updated is None:
            raise PersistenceError("Updated user is unavailable.")
        return updated, revoked_ids

    def replace_password(
        self,
        *,
        target_user_id: str,
        actor_user_id: str,
        password_hash: str,
        must_change_password: bool,
        now: str,
        event_type: str,
    ) -> tuple[UserRecord, tuple[str, ...]]:
        with self.transaction(immediate=True) as connection:
            row = connection.execute("SELECT * FROM users WHERE id=?", (target_user_id,)).fetchone()
            current = self._user(row)
            if current is None:
                raise PersistenceConflict("User does not exist.")
            revoked_rows = connection.execute(
                "SELECT id FROM user_sessions WHERE user_id=? AND revoked_at IS NULL",
                (target_user_id,),
            ).fetchall()
            revoked_ids = tuple(str(item["id"]) for item in revoked_rows)
            connection.execute(
                "UPDATE users SET password_hash=?,must_change_password=?,credential_version=?,"
                "failed_login_count=0,backoff_until=NULL,updated_at=? WHERE id=?",
                (
                    password_hash,
                    int(must_change_password),
                    current.credential_version + 1,
                    now,
                    target_user_id,
                ),
            )
            connection.execute(
                "UPDATE user_sessions SET revoked_at=?,revoked_reason='password_changed' "
                "WHERE user_id=? AND revoked_at IS NULL",
                (now, target_user_id),
            )
            self._insert_audit(
                connection,
                event_type=event_type,
                actor_user_id=actor_user_id,
                target_user_id=target_user_id,
                outcome="success",
                occurred_at=now,
            )
        updated = self.get_user(target_user_id)
        if updated is None:
            raise PersistenceError("Updated user is unavailable.")
        return updated, revoked_ids

    def create_session(
        self,
        *,
        user: UserRecord,
        session_id: str,
        token_hash: str,
        now: str,
        absolute_expires_at: str,
        idle_expires_at: str,
    ) -> None:
        with self.transaction(immediate=True) as connection:
            self._insert_session(
                connection,
                session_id=session_id,
                token_hash=token_hash,
                user_id=user.id,
                credential_version=user.credential_version,
                created_at=now,
                absolute_expires_at=absolute_expires_at,
                idle_expires_at=idle_expires_at,
            )

    def record_denied(
        self,
        *,
        actor_user_id: str | None,
        event_type: str,
        now: str,
        metadata: Mapping[str, Any] | None = None,
    ) -> None:
        with self.transaction() as connection:
            self._insert_audit(
                connection,
                event_type=event_type,
                actor_user_id=actor_user_id,
                target_user_id=None,
                outcome="denied",
                occurred_at=now,
                metadata=metadata,
            )

    def list_audit_events(self, *, limit: int = 100) -> tuple[AuditRecord, ...]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM audit_events ORDER BY occurred_at DESC,id DESC LIMIT ?",
                (max(1, min(limit, 250)),),
            ).fetchall()
        return tuple(
            AuditRecord(
                id=str(row["id"]),
                event_type=str(row["event_type"]),
                actor_user_id=row["actor_user_id"],
                target_user_id=row["target_user_id"],
                outcome=str(row["outcome"]),
                occurred_at=str(row["occurred_at"]),
                metadata=json.loads(str(row["metadata_json"])),
            )
            for row in rows
        )

    def active_session_ids(self, user_id: str) -> tuple[str, ...]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT id FROM user_sessions WHERE user_id=? AND revoked_at IS NULL",
                (user_id,),
            ).fetchall()
        return tuple(str(row["id"]) for row in rows)

    def execute_transaction_for_testing(self, statements: Sequence[tuple[str, Sequence[Any]]]) -> None:
        """Exercise rollback semantics without exposing a raw connection to callers."""

        with self.transaction(immediate=True) as connection:
            for statement, parameters in statements:
                connection.execute(statement, tuple(parameters))
