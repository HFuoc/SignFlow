"""Framework-neutral local authentication, session, RBAC, and audit services."""

from __future__ import annotations

import hashlib
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Callable, Mapping

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from argon2.low_level import Type

from app.desktop_collector.persistence import (
    ROLE_VALUES,
    AuditRecord,
    IdentityRepository,
    PersistenceConflict,
    SessionRecord,
    UserRecord,
    canonicalize_username,
)


PASSWORD_MIN_LENGTH = 12
PASSWORD_MAX_BYTES = 1_024
SESSION_ABSOLUTE_LIFETIME = timedelta(hours=8)
SESSION_IDLE_LIFETIME = timedelta(minutes=30)
SESSION_TOUCH_INTERVAL = timedelta(seconds=60)
COLLECTOR_ROLES = frozenset({"administrator", "developer", "researcher"})
ADMIN_ROLE = "administrator"


class AuthenticationError(RuntimeError):
    def __init__(self, code: str, public_message: str, *, status_code: int = 400) -> None:
        super().__init__(public_message)
        self.code = code
        self.public_message = public_message
        self.status_code = status_code


class InvalidCredentials(AuthenticationError):
    def __init__(self) -> None:
        super().__init__(
            "invalid_credentials",
            "Tên đăng nhập hoặc mật khẩu không đúng.",
            status_code=401,
        )


class SessionInvalid(AuthenticationError):
    def __init__(self) -> None:
        super().__init__("session_invalid", "Phiên đăng nhập không còn hợp lệ.", status_code=401)


class PermissionDenied(AuthenticationError):
    def __init__(self) -> None:
        super().__init__("permission_denied", "Bạn không có quyền thực hiện thao tác này.", status_code=403)


@dataclass(frozen=True)
class SessionPrincipal:
    session: SessionRecord
    user: UserRecord


@dataclass(frozen=True)
class IssuedSession:
    credential: str
    principal: SessionPrincipal


def _utc_text(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def public_user(user: UserRecord) -> dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "role": user.role,
        "is_active": user.is_active,
        "must_change_password": user.must_change_password,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login_at": user.last_login_at,
    }


class AuthService:
    """Own password policy, opaque sessions, and role-aware identity operations."""

    def __init__(
        self,
        repository: IdentityRepository,
        *,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self.repository = repository
        self._clock = clock or (lambda: datetime.now(UTC))
        self.password_hasher = PasswordHasher(
            time_cost=2,
            memory_cost=19_456,
            parallelism=1,
            hash_len=32,
            salt_len=16,
            type=Type.ID,
        )
        self._dummy_hash = self.password_hasher.hash("dummy credential used only for timing")

    def now(self) -> datetime:
        value = self._clock()
        return value if value.tzinfo else value.replace(tzinfo=UTC)

    @staticmethod
    def validate_username(value: str) -> str:
        username = canonicalize_username(value)
        if not 3 <= len(username) <= 64 or not re.fullmatch(r"[\w.-]+", username):
            raise AuthenticationError(
                "invalid_username",
                "Tên đăng nhập phải có 3–64 ký tự chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.",
            )
        return username

    @staticmethod
    def validate_display_name(value: str | None) -> str | None:
        if value is None:
            return None
        display_name = value.strip()
        if not display_name:
            return None
        if len(display_name) > 100:
            raise AuthenticationError("invalid_display_name", "Tên hiển thị không được quá 100 ký tự.")
        return display_name

    @staticmethod
    def validate_role(value: str) -> str:
        if value not in ROLE_VALUES:
            raise AuthenticationError("invalid_role", "Vai trò không hợp lệ.")
        return value

    @staticmethod
    def validate_password(value: str) -> str:
        if len(value) < PASSWORD_MIN_LENGTH:
            raise AuthenticationError(
                "password_too_short",
                f"Mật khẩu phải có ít nhất {PASSWORD_MIN_LENGTH} ký tự.",
            )
        if len(value.encode("utf-8")) > PASSWORD_MAX_BYTES:
            raise AuthenticationError(
                "password_too_long",
                "Mật khẩu vượt quá giới hạn 1024 byte.",
            )
        return value

    @staticmethod
    def token_hash(credential: str) -> str:
        return hashlib.sha256(credential.encode("utf-8")).hexdigest()

    def _session_values(self) -> tuple[str, str, str, str, str]:
        now = self.now()
        credential = secrets.token_urlsafe(32)
        return (
            credential,
            secrets.token_hex(16),
            self.token_hash(credential),
            _utc_text(now + SESSION_ABSOLUTE_LIFETIME),
            _utc_text(now + SESSION_IDLE_LIFETIME),
        )

    def setup_required(self) -> bool:
        return self.repository.user_count() == 0

    def bootstrap_administrator(
        self,
        *,
        username: str,
        display_name: str | None,
        password: str,
        password_confirmation: str,
    ) -> IssuedSession:
        canonical = self.validate_username(username)
        display = self.validate_display_name(display_name)
        self.validate_password(password)
        if password != password_confirmation:
            raise AuthenticationError("password_mismatch", "Hai mật khẩu chưa khớp.")
        password_hash = self.password_hasher.hash(password)
        credential, session_id, token_hash, absolute_expiry, idle_expiry = self._session_values()
        now = _utc_text(self.now())
        try:
            user = self.repository.bootstrap_administrator(
                username=canonical,
                display_name=display,
                password_hash=password_hash,
                session_id=session_id,
                session_token_hash=token_hash,
                now=now,
                absolute_expires_at=absolute_expiry,
                idle_expires_at=idle_expiry,
            )
        except PersistenceConflict as error:
            raise AuthenticationError("setup_unavailable", "Thiết lập ban đầu không còn khả dụng.", status_code=409) from error
        principal = self.validate_session(credential, touch=False)
        return IssuedSession(credential=credential, principal=principal)

    def _verify_password(self, password_hash: str, password: str) -> bool:
        try:
            return bool(self.password_hasher.verify(password_hash, password))
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False

    def login(self, *, username: str, password: str) -> IssuedSession:
        if len(password.encode("utf-8")) > PASSWORD_MAX_BYTES:
            raise InvalidCredentials()
        canonical = canonicalize_username(username)
        user = self.repository.find_user_by_username(canonical)
        now_dt = self.now()
        now = _utc_text(now_dt)
        if user is None:
            self._verify_password(self._dummy_hash, password)
            self.repository.record_login_failure(
                user_id=None,
                failed_login_count=None,
                backoff_until=None,
                now=now,
                reason="invalid_credentials",
            )
            raise InvalidCredentials()
        if user.backoff_until and _parse_utc(user.backoff_until) > now_dt:
            self.repository.record_login_failure(
                user_id=user.id,
                failed_login_count=user.failed_login_count,
                backoff_until=user.backoff_until,
                now=now,
                reason="backoff_active",
            )
            raise InvalidCredentials()
        valid = self._verify_password(user.password_hash, password)
        if not valid or not user.is_active:
            failures = user.failed_login_count + 1
            delay = min(300, 2 ** max(0, failures - 5)) if failures >= 5 else 0
            backoff_until = _utc_text(now_dt + timedelta(seconds=delay)) if delay else None
            self.repository.record_login_failure(
                user_id=user.id,
                failed_login_count=failures,
                backoff_until=backoff_until,
                now=now,
                reason="account_disabled" if not user.is_active else "invalid_credentials",
            )
            raise InvalidCredentials()
        replacement_hash = (
            self.password_hasher.hash(password)
            if self.password_hasher.check_needs_rehash(user.password_hash)
            else None
        )
        credential, session_id, token_hash, absolute_expiry, idle_expiry = self._session_values()
        self.repository.complete_login(
            user=user,
            session_id=session_id,
            session_token_hash=token_hash,
            now=now,
            absolute_expires_at=absolute_expiry,
            idle_expires_at=idle_expiry,
            replacement_password_hash=replacement_hash,
        )
        return IssuedSession(credential=credential, principal=self.validate_session(credential, touch=False))

    def validate_session(self, credential: str | None, *, touch: bool = True) -> SessionPrincipal:
        if not credential:
            raise SessionInvalid()
        result = self.repository.find_session(self.token_hash(credential))
        if result is None:
            raise SessionInvalid()
        session, user = result
        now = self.now()
        expired = now >= _parse_utc(session.absolute_expires_at) or now >= _parse_utc(session.idle_expires_at)
        invalid = (
            session.revoked_at is not None
            or expired
            or not user.is_active
            or session.credential_version != user.credential_version
        )
        if invalid:
            if session.revoked_at is None:
                self.repository.revoke_session_by_token(
                    self.token_hash(credential),
                    now=_utc_text(now),
                    reason="expired_or_invalid",
                    audit=False,
                )
            raise SessionInvalid()
        if touch and now - _parse_utc(session.last_seen_at) >= SESSION_TOUCH_INTERVAL:
            idle_expiry = min(now + SESSION_IDLE_LIFETIME, _parse_utc(session.absolute_expires_at))
            self.repository.touch_session(
                session.id,
                last_seen_at=_utc_text(now),
                idle_expires_at=_utc_text(idle_expiry),
            )
            result = self.repository.find_session(self.token_hash(credential))
            if result is not None:
                session, user = result
        return SessionPrincipal(session=session, user=user)

    def logout(self, credential: str | None) -> str | None:
        if not credential:
            return None
        return self.repository.revoke_session_by_token(
            self.token_hash(credential),
            now=_utc_text(self.now()),
            reason="logout",
        )

    def create_user(
        self,
        actor: SessionPrincipal,
        *,
        username: str,
        display_name: str | None,
        password: str,
        role: str,
    ) -> UserRecord:
        self.require_roles(actor, {ADMIN_ROLE})
        canonical = self.validate_username(username)
        display = self.validate_display_name(display_name)
        self.validate_password(password)
        role = self.validate_role(role)
        try:
            return self.repository.create_user(
                username=canonical,
                display_name=display,
                password_hash=self.password_hasher.hash(password),
                role=role,
                actor_user_id=actor.user.id,
                now=_utc_text(self.now()),
            )
        except PersistenceConflict as error:
            raise AuthenticationError("username_conflict", "Tên đăng nhập đã được sử dụng.", status_code=409) from error

    def update_user(
        self,
        actor: SessionPrincipal,
        *,
        target_user_id: str,
        display_name: str | None,
        role: str | None,
        is_active: bool | None,
    ) -> tuple[UserRecord, tuple[str, ...]]:
        self.require_roles(actor, {ADMIN_ROLE})
        display = self.validate_display_name(display_name)
        validated_role = self.validate_role(role) if role is not None else None
        try:
            return self.repository.update_user_by_administrator(
                target_user_id=target_user_id,
                actor_user_id=actor.user.id,
                display_name=display,
                role=validated_role,
                is_active=is_active,
                now=_utc_text(self.now()),
            )
        except PersistenceConflict as error:
            message = (
                "Phải giữ ít nhất một quản trị viên đang hoạt động."
                if "final active" in str(error).lower()
                else "Không tìm thấy tài khoản."
            )
            raise AuthenticationError("protected_or_missing_user", message, status_code=409) from error

    def reset_password(
        self,
        actor: SessionPrincipal,
        *,
        target_user_id: str,
        temporary_password: str,
    ) -> tuple[UserRecord, tuple[str, ...]]:
        self.require_roles(actor, {ADMIN_ROLE})
        self.validate_password(temporary_password)
        try:
            return self.repository.replace_password(
                target_user_id=target_user_id,
                actor_user_id=actor.user.id,
                password_hash=self.password_hasher.hash(temporary_password),
                must_change_password=True,
                now=_utc_text(self.now()),
                event_type="password_reset",
            )
        except PersistenceConflict as error:
            raise AuthenticationError("missing_user", "Không tìm thấy tài khoản.", status_code=404) from error

    def change_password(
        self,
        principal: SessionPrincipal,
        *,
        current_password: str,
        new_password: str,
        new_password_confirmation: str,
    ) -> IssuedSession:
        self.validate_password(new_password)
        if new_password != new_password_confirmation:
            raise AuthenticationError("password_mismatch", "Hai mật khẩu mới chưa khớp.")
        if not self._verify_password(principal.user.password_hash, current_password):
            raise AuthenticationError("current_password_invalid", "Mật khẩu hiện tại không đúng.", status_code=401)
        updated, _ = self.repository.replace_password(
            target_user_id=principal.user.id,
            actor_user_id=principal.user.id,
            password_hash=self.password_hasher.hash(new_password),
            must_change_password=False,
            now=_utc_text(self.now()),
            event_type="password_changed",
        )
        credential, session_id, token_hash, absolute_expiry, idle_expiry = self._session_values()
        now = _utc_text(self.now())
        self.repository.create_session(
            user=updated,
            session_id=session_id,
            token_hash=token_hash,
            now=now,
            absolute_expires_at=absolute_expiry,
            idle_expires_at=idle_expiry,
        )
        return IssuedSession(credential=credential, principal=self.validate_session(credential, touch=False))

    def revoke_user_sessions(
        self,
        actor: SessionPrincipal,
        *,
        target_user_id: str,
    ) -> tuple[str, ...]:
        self.require_roles(actor, {ADMIN_ROLE})
        if self.repository.get_user(target_user_id) is None:
            raise AuthenticationError("missing_user", "Không tìm thấy tài khoản.", status_code=404)
        return self.repository.revoke_user_sessions(
            target_user_id,
            actor_user_id=actor.user.id,
            now=_utc_text(self.now()),
            reason="administrator_revoked",
        )

    def require_roles(self, principal: SessionPrincipal, roles: set[str] | frozenset[str]) -> None:
        if principal.user.role not in roles:
            raise PermissionDenied()

    def record_denied(
        self,
        principal: SessionPrincipal | None,
        *,
        action: str,
        path: str,
    ) -> None:
        self.repository.record_denied(
            actor_user_id=principal.user.id if principal else None,
            event_type="privileged_action_denied",
            now=_utc_text(self.now()),
            metadata={"action": action, "path": path},
        )

    def users(self, actor: SessionPrincipal) -> tuple[UserRecord, ...]:
        self.require_roles(actor, {ADMIN_ROLE})
        return self.repository.list_users()

    def audit_events(self, actor: SessionPrincipal, *, limit: int = 100) -> tuple[AuditRecord, ...]:
        self.require_roles(actor, {ADMIN_ROLE})
        return self.repository.list_audit_events(limit=limit)

    @staticmethod
    def public_principal(principal: SessionPrincipal) -> dict[str, Any]:
        return public_user(principal.user)

    @staticmethod
    def safe_audit(event: AuditRecord) -> dict[str, Any]:
        return {
            "id": event.id,
            "event_type": event.event_type,
            "actor_user_id": event.actor_user_id,
            "target_user_id": event.target_user_id,
            "outcome": event.outcome,
            "occurred_at": event.occurred_at,
            "metadata": dict(event.metadata),
        }
