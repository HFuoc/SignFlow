"""Loopback-only FastAPI bridge for simulator control and display telemetry."""

from __future__ import annotations

import asyncio
import hmac
import math
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from fastapi import FastAPI, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.desktop_collector.auth import (
    ADMIN_ROLE,
    COLLECTOR_ROLES,
    AuthService,
    AuthenticationError,
    PermissionDenied,
    SessionInvalid,
    SessionPrincipal,
    public_user,
)
from app.desktop_collector.acquisition import (
    CHANNEL_NAMES,
    AcquisitionController,
    BufferCursor,
    packet_channels,
)
from app.desktop_collector.domain import ConnectionState, DeviceStatistics, SensorPacket
from app.desktop_collector.persistence import IdentityRepository, default_database_path
from app.desktop_collector.sources import (
    SimulationConfig,
    SimulatedDataSource,
    create_simulated_pair,
)


BRIDGE_SCHEMA_VERSION = "1.0"
DEFAULT_DISPLAY_FPS = 25
MIN_DISPLAY_FPS = 10
MAX_DISPLAY_FPS = 30
MAX_BATCH_PACKETS = 2_000
USER_SESSION_COOKIE = "smartglove_user_session"

CHANNEL_DEFINITIONS = (
    ("flex_thumb_raw", "Ngón cái", "ADC", "flex"),
    ("flex_index_raw", "Ngón trỏ", "ADC", "flex"),
    ("flex_middle_raw", "Ngón giữa", "ADC", "flex"),
    ("flex_ring_raw", "Ngón áp út", "ADC", "flex"),
    ("flex_little_raw", "Ngón út", "ADC", "flex"),
    ("fsr_raw", "Lực FSR", "ADC", "fsr"),
    ("accel_x_raw", "Gia tốc X", "raw", "accel"),
    ("accel_y_raw", "Gia tốc Y", "raw", "accel"),
    ("accel_z_raw", "Gia tốc Z", "raw", "accel"),
    ("gyro_x_raw", "Gyroscope X", "raw", "gyro"),
    ("gyro_y_raw", "Gyroscope Y", "raw", "gyro"),
    ("gyro_z_raw", "Gyroscope Z", "raw", "gyro"),
    ("distance_mm", "Khoảng cách", "mm", "distance"),
)


class SimulationRequest(BaseModel):
    seed: int = 2026
    sample_rate_hz: float = Field(default=50.0, ge=1.0, le=500.0)
    noise_std: float = Field(default=7.0, ge=0.0, le=500.0)
    packet_loss_rate: float = Field(default=0.01, ge=0.0, lt=1.0)


class SetupRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)
    password: str = Field(min_length=1, max_length=1_024)
    password_confirmation: str = Field(min_length=1, max_length=1_024)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=1, max_length=1_024)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=1_024)
    new_password: str = Field(min_length=1, max_length=1_024)
    new_password_confirmation: str = Field(min_length=1, max_length=1_024)


class CreateUserRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    display_name: str | None = Field(default=None, max_length=100)
    password: str = Field(min_length=1, max_length=1_024)
    role: str


class UpdateUserRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    role: str | None = None
    is_active: bool | None = None


class ResetPasswordRequest(BaseModel):
    temporary_password: str = Field(min_length=1, max_length=1_024)


class WebSocketHub:
    """Track only active authenticated sockets; no telemetry queue is retained."""

    def __init__(self) -> None:
        self._clients: dict[WebSocket, str] = {}

    def add(self, websocket: WebSocket, session_id: str) -> None:
        self._clients[websocket] = session_id

    def discard(self, websocket: WebSocket) -> None:
        self._clients.pop(websocket, None)

    async def close_all(self) -> None:
        clients = tuple(self._clients)
        self._clients.clear()
        if clients:
            await asyncio.gather(
                *(client.close(code=1001, reason="desktop shell shutdown") for client in clients),
                return_exceptions=True,
            )

    async def close_sessions(self, session_ids: set[str] | tuple[str, ...]) -> None:
        selected = tuple(
            client for client, session_id in self._clients.items() if session_id in session_ids
        )
        for client in selected:
            self._clients.pop(client, None)
        if selected:
            await asyncio.gather(
                *(client.close(code=4401, reason="user session ended") for client in selected),
                return_exceptions=True,
            )


class AppRuntime:
    """Own simulator sources, acquisition, both auth layers, and shutdown state."""

    def __init__(
        self,
        session_token: str,
        *,
        auto_connect: bool = False,
        database_path: Path | None = None,
    ) -> None:
        if not session_token:
            raise ValueError("session token must not be empty")
        self._session_token = session_token
        self.identity_repository = IdentityRepository(database_path or default_database_path())
        self.auth = AuthService(self.identity_repository)
        self.controller = AcquisitionController()
        self.sources: list[SimulatedDataSource] = list(create_simulated_pair())
        for source in self.sources:
            self.controller.register_source(source)
        self.hub = WebSocketHub()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._shutdown_lock = threading.Lock()
        self._acquisition_stopped = False
        if auto_connect:
            for source in self.sources:
                self.controller.connect_source(source.descriptor.device_id)

    def token_matches(self, candidate: str) -> bool:
        return bool(candidate) and hmac.compare_digest(self._session_token, candidate)

    def set_event_loop(self, loop: asyncio.AbstractEventLoop | None) -> None:
        self._loop = loop

    def stop_acquisition(self) -> None:
        with self._shutdown_lock:
            if self._acquisition_stopped:
                return
            self._acquisition_stopped = True
        self.controller.disconnect_all()

    def close_websockets_threadsafe(self, timeout_s: float = 3.0) -> None:
        loop = self._loop
        if loop is None or not loop.is_running():
            return
        future = asyncio.run_coroutine_threadsafe(self.hub.close_all(), loop)
        try:
            future.result(timeout=timeout_s)
        except Exception:
            future.cancel()

    def clear_secret(self) -> None:
        self._session_token = ""

    def close_persistence(self) -> None:
        self.identity_repository.close()

    def reconfigure(self, request: SimulationRequest) -> None:
        connected = {
            source.descriptor.device_id
            for source in self.sources
            if source.state is not ConnectionState.DISCONNECTED
        }
        self.controller.disconnect_all()
        for index, source in enumerate(self.sources):
            source.reconfigure(
                SimulationConfig(
                    seed=request.seed + index,
                    sample_rate_hz=request.sample_rate_hz,
                    noise_std=request.noise_std,
                    packet_loss_rate=request.packet_loss_rate,
                )
            )
            self.controller.reset_device_data(source.descriptor.device_id)
        for source in self.sources:
            if source.descriptor.device_id in connected:
                self.controller.connect_source(source.descriptor.device_id)

    def bootstrap(self) -> dict[str, Any]:
        first_config = self.sources[0].config
        return {
            "bridge_schema_version": BRIDGE_SCHEMA_VERSION,
            "display_fps": DEFAULT_DISPLAY_FPS,
            "display_fps_limits": [MIN_DISPLAY_FPS, MAX_DISPLAY_FPS],
            "channels": [
                {"id": channel, "label": label, "unit": unit, "group": group}
                for channel, label, unit, group in CHANNEL_DEFINITIONS
            ],
            "devices": [self._device_payload(source) for source in self.sources],
            "simulation": {
                "seed": first_config.seed,
                "sample_rate_hz": first_config.sample_rate_hz,
                "noise_std": first_config.noise_std,
                "packet_loss_rate": first_config.packet_loss_rate,
            },
        }

    @staticmethod
    def _device_payload(source: SimulatedDataSource) -> dict[str, Any]:
        descriptor = source.descriptor
        capabilities = descriptor.capabilities
        return {
            "device_id": descriptor.device_id,
            "display_name": descriptor.display_name,
            "hand": descriptor.hand.value,
            "hand_label": descriptor.hand.short_label,
            "source_kind": descriptor.source_kind,
            "nominal_sample_rate_hz": descriptor.nominal_sample_rate_hz,
            "simulated": descriptor.simulated,
            "state": source.state.value,
            "capabilities": {
                "flex_channels": list(capabilities.flex_channels),
                "fsr": capabilities.fsr,
                "accelerometer": capabilities.accelerometer,
                "gyroscope": capabilities.gyroscope,
                "distance": capabilities.distance,
            },
        }


def _finite(value: float) -> float | None:
    return value if math.isfinite(value) else None


def _statistics_payload(device_id: str, stats: DeviceStatistics) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "received_packets": stats.received_packets,
        "lost_packets": stats.lost_packets,
        "sample_rate_hz": stats.sample_rate_hz,
        "packet_loss_percent": stats.packet_loss_percent,
        "last_packet_host_ns": (
            str(stats.last_packet_host_ns) if stats.last_packet_host_ns is not None else None
        ),
        "channel_stddev": {key: _finite(value) for key, value in stats.channel_stddev.items()},
        "channel_peak_to_peak": {
            key: _finite(value) for key, value in stats.channel_peak_to_peak.items()
        },
    }


def _packet_block(device_id: str, packets: tuple[SensorPacket, ...]) -> dict[str, Any]:
    values: dict[str, list[int | None]] = {channel: [] for channel in CHANNEL_NAMES}
    for packet in packets:
        channels = packet_channels(packet)
        for channel in CHANNEL_NAMES:
            values[channel].append(channels[channel])
    return {
        "device_id": device_id,
        "sequence_numbers": [packet.sequence_number for packet in packets],
        "device_timestamp_ms": [packet.device_timestamp_ms for packet in packets],
        "host_timestamp_ns": [str(packet.host_timestamp_ns) for packet in packets],
        "status_flags": [packet.status_flags for packet in packets],
        "quality_flags": [int(packet.quality_flags) for packet in packets],
        "simulated": [packet.simulated for packet in packets],
        "values": values,
    }


def _is_explicit_loopback_origin(origin: str) -> bool:
    try:
        parsed = urlsplit(origin)
        port = parsed.port
    except ValueError:
        return False
    return (
        parsed.scheme == "http"
        and parsed.hostname == "127.0.0.1"
        and port is not None
        and parsed.username is None
        and parsed.password is None
        and not parsed.path
        and not parsed.query
        and not parsed.fragment
        and origin == f"http://127.0.0.1:{port}"
    )


def create_app(
    *,
    session_token: str,
    port: int,
    allowed_origins: tuple[str, ...],
    development: bool = False,
    auto_connect: bool = False,
    web_build_dir: Path | None = None,
    database_path: Path | None = None,
) -> FastAPI:
    """Create one session-bound app; callers must supply a loopback port."""

    if not 1 <= port <= 65_535:
        raise ValueError("port must be a bound TCP port")
    expected_host = f"127.0.0.1:{port}"
    allowed_origin_set = frozenset(allowed_origins)
    if not allowed_origin_set or any(
        not _is_explicit_loopback_origin(origin) for origin in allowed_origin_set
    ):
        raise ValueError("all origins must be explicit IPv4 loopback origins")

    runtime = AppRuntime(
        session_token=session_token,
        auto_connect=auto_connect,
        database_path=database_path,
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        runtime.set_event_loop(asyncio.get_running_loop())
        try:
            yield
        finally:
            runtime.stop_acquisition()
            await runtime.hub.close_all()
            runtime.set_event_loop(None)
            runtime.close_persistence()

    app = FastAPI(
        title="SmartGlove local bridge",
        docs_url="/docs" if development else None,
        redoc_url=None,
        openapi_url="/openapi.json" if development else None,
        lifespan=lifespan,
    )
    app.state.runtime = runtime
    app.state.expected_host = expected_host

    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(
        _: Request, error: AuthenticationError
    ) -> JSONResponse:
        return JSONResponse(
            {"detail": error.public_message, "code": error.code},
            status_code=error.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def request_validation_error_handler(
        _: Request, __: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            {"detail": "invalid request", "code": "invalid_request"},
            status_code=422,
        )

    @app.middleware("http")
    async def local_boundary(request: Request, call_next):  # type: ignore[no-untyped-def]
        host = request.headers.get("host", "")
        if host != expected_host:
            return JSONResponse({"detail": "invalid local host"}, status_code=400)

        origin = request.headers.get("origin")
        if origin and origin not in allowed_origin_set:
            return JSONResponse({"detail": "origin not allowed"}, status_code=403)

        if request.method == "OPTIONS":
            if not development or origin not in allowed_origin_set:
                return JSONResponse({"detail": "preflight not allowed"}, status_code=403)
            response = Response(status_code=204)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
            return response

        path = request.url.path
        protected = path.startswith("/api/v1/") and path != "/api/v1/health"
        state_changing = request.method in {"POST", "PUT", "PATCH", "DELETE"}
        if state_changing and origin not in allowed_origin_set:
            return JSONResponse({"detail": "origin required"}, status_code=403)
        if protected:
            authorization = request.headers.get("authorization", "")
            scheme, _, candidate = authorization.partition(" ")
            if scheme.lower() != "bearer" or not runtime.token_matches(candidate):
                return JSONResponse({"detail": "not authenticated"}, status_code=401)

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        if path.startswith("/api/v1/"):
            response.headers["Cache-Control"] = "no-store"
        if not development:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                "script-src 'self'; connect-src 'self' ws://127.0.0.1:*; "
                "base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
            )
        if development and origin in allowed_origin_set:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"
        return response

    def user_session_cookie(request: Request) -> str | None:
        return request.cookies.get(USER_SESSION_COOKIE)

    async def session_principal(
        request: Request,
        *,
        roles: frozenset[str] | set[str] | None = None,
        allow_password_change: bool = False,
    ) -> SessionPrincipal:
        try:
            principal = await asyncio.to_thread(
                runtime.auth.validate_session,
                user_session_cookie(request),
            )
        except SessionInvalid:
            runtime.auth.record_denied(None, action=request.method, path=request.url.path)
            raise
        if principal.user.must_change_password and not allow_password_change:
            runtime.auth.record_denied(principal, action=request.method, path=request.url.path)
            raise AuthenticationError(
                "password_change_required",
                "Bạn phải đổi mật khẩu trước khi tiếp tục.",
                status_code=403,
            )
        if roles is not None:
            try:
                runtime.auth.require_roles(principal, roles)
            except PermissionDenied:
                runtime.auth.record_denied(principal, action=request.method, path=request.url.path)
                raise
        return principal

    def set_user_cookie(response: JSONResponse, credential: str) -> None:
        response.set_cookie(
            USER_SESSION_COOKIE,
            credential,
            httponly=True,
            secure=False,
            samesite="strict",
            path="/",
        )

    def clear_user_cookie(response: JSONResponse) -> None:
        response.delete_cookie(
            USER_SESSION_COOKIE,
            httponly=True,
            secure=False,
            samesite="strict",
            path="/",
        )

    @app.get("/api/v1/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/v1/auth/status")
    async def auth_status(request: Request) -> dict[str, Any]:
        setup_required = await asyncio.to_thread(runtime.auth.setup_required)
        if setup_required:
            return {"setup_required": True, "authenticated": False, "user": None}
        try:
            principal = await asyncio.to_thread(
                runtime.auth.validate_session,
                user_session_cookie(request),
            )
        except SessionInvalid:
            return {"setup_required": False, "authenticated": False, "user": None}
        return {
            "setup_required": False,
            "authenticated": True,
            "user": runtime.auth.public_principal(principal),
        }

    @app.post("/api/v1/auth/setup", status_code=201)
    async def setup_administrator(payload: SetupRequest) -> JSONResponse:
        issued = await asyncio.to_thread(
            runtime.auth.bootstrap_administrator,
            username=payload.username,
            display_name=payload.display_name,
            password=payload.password,
            password_confirmation=payload.password_confirmation,
        )
        response = JSONResponse(
            {
                "setup_required": False,
                "authenticated": True,
                "user": runtime.auth.public_principal(issued.principal),
            },
            status_code=201,
        )
        set_user_cookie(response, issued.credential)
        return response

    @app.post("/api/v1/auth/login")
    async def login(payload: LoginRequest) -> JSONResponse:
        issued = await asyncio.to_thread(
            runtime.auth.login,
            username=payload.username,
            password=payload.password,
        )
        response = JSONResponse(
            {
                "setup_required": False,
                "authenticated": True,
                "user": runtime.auth.public_principal(issued.principal),
            }
        )
        set_user_cookie(response, issued.credential)
        return response

    @app.post("/api/v1/auth/logout")
    async def logout(request: Request) -> JSONResponse:
        credential = user_session_cookie(request)
        session_id = await asyncio.to_thread(runtime.auth.logout, credential)
        if session_id:
            await runtime.hub.close_sessions({session_id})
        response = JSONResponse({"authenticated": False})
        clear_user_cookie(response)
        return response

    @app.post("/api/v1/auth/change-password")
    async def change_password(request: Request, payload: ChangePasswordRequest) -> JSONResponse:
        principal = await session_principal(request, allow_password_change=True)
        old_session_ids = runtime.identity_repository.active_session_ids(principal.user.id)
        issued = await asyncio.to_thread(
            runtime.auth.change_password,
            principal,
            current_password=payload.current_password,
            new_password=payload.new_password,
            new_password_confirmation=payload.new_password_confirmation,
        )
        await runtime.hub.close_sessions(
            tuple(session_id for session_id in old_session_ids if session_id != principal.session.id)
        )
        response = JSONResponse(
            {
                "setup_required": False,
                "authenticated": True,
                "user": runtime.auth.public_principal(issued.principal),
            }
        )
        set_user_cookie(response, issued.credential)
        return response

    @app.get("/api/v1/admin/users")
    async def list_users(request: Request) -> dict[str, Any]:
        principal = await session_principal(request, roles={ADMIN_ROLE})
        users = await asyncio.to_thread(runtime.auth.users, principal)
        return {"users": [public_user(user) for user in users]}

    @app.post("/api/v1/admin/users", status_code=201)
    async def create_user(request: Request, payload: CreateUserRequest) -> JSONResponse:
        principal = await session_principal(request, roles={ADMIN_ROLE})
        user = await asyncio.to_thread(
            runtime.auth.create_user,
            principal,
            username=payload.username,
            display_name=payload.display_name,
            password=payload.password,
            role=payload.role,
        )
        return JSONResponse({"user": public_user(user)}, status_code=201)

    @app.patch("/api/v1/admin/users/{user_id}")
    async def update_user(
        user_id: str,
        request: Request,
        payload: UpdateUserRequest,
    ) -> dict[str, Any]:
        principal = await session_principal(request, roles={ADMIN_ROLE})
        user, revoked_ids = await asyncio.to_thread(
            runtime.auth.update_user,
            principal,
            target_user_id=user_id,
            display_name=payload.display_name,
            role=payload.role,
            is_active=payload.is_active,
        )
        await runtime.hub.close_sessions(revoked_ids)
        return {"user": public_user(user)}

    @app.post("/api/v1/admin/users/{user_id}/reset-password")
    async def reset_user_password(
        user_id: str,
        request: Request,
        payload: ResetPasswordRequest,
    ) -> dict[str, Any]:
        principal = await session_principal(request, roles={ADMIN_ROLE})
        user, revoked_ids = await asyncio.to_thread(
            runtime.auth.reset_password,
            principal,
            target_user_id=user_id,
            temporary_password=payload.temporary_password,
        )
        await runtime.hub.close_sessions(revoked_ids)
        return {"user": public_user(user)}

    @app.post("/api/v1/admin/users/{user_id}/revoke-sessions")
    async def revoke_user_sessions(user_id: str, request: Request) -> dict[str, int]:
        principal = await session_principal(request, roles={ADMIN_ROLE})
        revoked_ids = await asyncio.to_thread(
            runtime.auth.revoke_user_sessions,
            principal,
            target_user_id=user_id,
        )
        await runtime.hub.close_sessions(revoked_ids)
        return {"revoked_sessions": len(revoked_ids)}

    @app.get("/api/v1/admin/audit-events")
    async def audit_events(request: Request, limit: int = Query(default=100, ge=1, le=250)) -> dict[str, Any]:
        principal = await session_principal(request, roles={ADMIN_ROLE})
        events = await asyncio.to_thread(runtime.auth.audit_events, principal, limit=limit)
        return {"events": [runtime.auth.safe_audit(event) for event in events]}

    @app.get("/api/v1/bootstrap")
    async def bootstrap(request: Request) -> dict[str, Any]:
        await session_principal(request, roles=COLLECTOR_ROLES)
        return runtime.bootstrap()

    @app.post("/api/v1/devices/{device_id}/connect")
    async def connect_device(device_id: str, request: Request) -> dict[str, str]:
        await session_principal(request, roles=COLLECTOR_ROLES)
        source = next(
            (item for item in runtime.sources if item.descriptor.device_id == device_id),
            None,
        )
        if source is None:
            return JSONResponse({"detail": "unknown device"}, status_code=404)  # type: ignore[return-value]
        runtime.controller.connect_source(device_id)
        return {"device_id": device_id, "state": source.state.value}

    @app.post("/api/v1/devices/{device_id}/disconnect")
    async def disconnect_device(device_id: str, request: Request) -> dict[str, str]:
        await session_principal(request, roles=COLLECTOR_ROLES)
        if device_id not in {source.descriptor.device_id for source in runtime.sources}:
            return JSONResponse({"detail": "unknown device"}, status_code=404)  # type: ignore[return-value]
        runtime.controller.disconnect_source(device_id)
        return {"device_id": device_id, "state": "disconnected"}

    @app.put("/api/v1/simulator/config")
    async def simulator_config(payload: SimulationRequest, request: Request) -> dict[str, Any]:
        await session_principal(request, roles=COLLECTOR_ROLES)
        runtime.reconfigure(payload)
        return runtime.bootstrap()["simulation"]

    @app.get("/api/v1/telemetry/snapshot")
    async def telemetry_snapshot(
        request: Request,
        window_seconds: float = Query(default=10.0, ge=5.0, le=60.0),
    ) -> dict[str, Any]:
        await session_principal(request, roles=COLLECTOR_ROLES)
        return {
            "type": "telemetry_snapshot",
            "bridge_schema_version": BRIDGE_SCHEMA_VERSION,
            "window_seconds": window_seconds,
            "devices": [
                _packet_block(
                    source.descriptor.device_id,
                    runtime.controller.window_packets(
                        source.descriptor.device_id, window_seconds
                    ),
                )
                for source in runtime.sources
            ],
        }

    @app.websocket("/ws/v1/telemetry")
    async def telemetry_socket(websocket: WebSocket) -> None:
        if websocket.headers.get("host", "") != expected_host:
            await websocket.close(code=1008, reason="invalid local host")
            return
        if websocket.headers.get("origin", "") not in allowed_origin_set:
            await websocket.close(code=1008, reason="origin not allowed")
            return

        await websocket.accept()
        authenticated = False
        principal: SessionPrincipal | None = None
        try:
            first = await asyncio.wait_for(websocket.receive_json(), timeout=3.0)
            authenticated = (
                isinstance(first, dict)
                and first.get("type") == "authenticate"
                and runtime.token_matches(str(first.get("token", "")))
            )
            if not authenticated:
                await websocket.close(code=1008, reason="authentication required")
                return

            try:
                principal = await asyncio.to_thread(
                    runtime.auth.validate_session,
                    websocket.cookies.get(USER_SESSION_COOKIE),
                )
                runtime.auth.require_roles(principal, COLLECTOR_ROLES)
                if principal.user.must_change_password:
                    raise PermissionDenied()
            except SessionInvalid:
                await websocket.close(code=4401, reason="user authentication required")
                return
            except PermissionDenied:
                runtime.auth.record_denied(principal, action="WEBSOCKET", path=websocket.url.path)
                await websocket.close(code=4403, reason="collector access denied")
                return

            runtime.hub.add(websocket, principal.session.id)
            await websocket.send_json({"type": "hello", **runtime.bootstrap()})
            cursors: dict[str, BufferCursor] = {
                source.descriptor.device_id: runtime.controller.current_cursor(
                    source.descriptor.device_id
                )
                for source in runtime.sources
            }
            last_states = {
                source.descriptor.device_id: source.state.value for source in runtime.sources
            }
            display_fps = DEFAULT_DISPLAY_FPS
            batch_sequence = 0
            next_flush = time.monotonic() + 1.0 / display_fps
            next_statistics = time.monotonic()
            next_auth_check = time.monotonic() + 1.0

            while True:
                timeout = max(0.0, next_flush - time.monotonic())
                message: dict[str, Any] | None = None
                try:
                    incoming = await asyncio.wait_for(websocket.receive_json(), timeout=timeout)
                    if isinstance(incoming, dict):
                        message = incoming
                except TimeoutError:
                    pass

                if message:
                    if message.get("type") == "ping":
                        await websocket.send_json({"type": "pong"})
                    elif message.get("type") == "stream_config":
                        requested = int(message.get("display_fps", DEFAULT_DISPLAY_FPS))
                        display_fps = max(MIN_DISPLAY_FPS, min(MAX_DISPLAY_FPS, requested))

                now = time.monotonic()
                if now >= next_auth_check:
                    next_auth_check = now + 1.0
                    try:
                        principal = await asyncio.to_thread(
                            runtime.auth.validate_session,
                            websocket.cookies.get(USER_SESSION_COOKIE),
                        )
                        runtime.auth.require_roles(principal, COLLECTOR_ROLES)
                        if principal.user.must_change_password:
                            raise PermissionDenied()
                    except (SessionInvalid, PermissionDenied):
                        await websocket.close(code=4401, reason="user session ended")
                        return
                if now < next_flush:
                    continue
                next_flush = now + 1.0 / display_fps

                blocks: list[dict[str, Any]] = []
                for source in runtime.sources:
                    device_id = source.descriptor.device_id
                    state = source.state.value
                    if state != last_states[device_id]:
                        await websocket.send_json(
                            {
                                "type": "device_state",
                                "device_id": device_id,
                                "state": state,
                            }
                        )
                        last_states[device_id] = state
                    snapshot = runtime.controller.packets_since(
                        device_id, cursors[device_id], MAX_BATCH_PACKETS
                    )
                    cursors[device_id] = snapshot.next_cursor
                    if snapshot.overrun:
                        await websocket.send_json(
                            {
                                "type": "resync_required",
                                "device_id": device_id,
                                "reason": "display cursor overrun or buffer reset",
                            }
                        )
                    if snapshot.packets:
                        blocks.append(_packet_block(device_id, snapshot.packets))

                if blocks:
                    batch_sequence += 1
                    await websocket.send_json(
                        {
                            "type": "telemetry_batch",
                            "bridge_schema_version": BRIDGE_SCHEMA_VERSION,
                            "batch_sequence": batch_sequence,
                            "sent_host_ns": str(time.time_ns()),
                            "devices": blocks,
                        }
                    )

                if now >= next_statistics:
                    next_statistics = now + 0.25
                    await websocket.send_json(
                        {
                            "type": "statistics",
                            "devices": [
                                _statistics_payload(
                                    source.descriptor.device_id,
                                    runtime.controller.statistics(
                                        source.descriptor.device_id
                                    ),
                                )
                                for source in runtime.sources
                            ],
                        }
                    )
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass
        except Exception:
            if authenticated:
                try:
                    await websocket.close(code=1011, reason="local telemetry error")
                except Exception:
                    pass
        finally:
            runtime.hub.discard(websocket)

    build_dir = web_build_dir or Path(__file__).resolve().parents[1] / "web" / "build"
    if build_dir.is_dir():
        app.mount("/", StaticFiles(directory=build_dir, html=True), name="collector-web")
    else:
        @app.get("/")
        async def missing_build() -> JSONResponse:
            return JSONResponse(
                {"detail": "web build is not present; use the Vite development server"},
                status_code=503,
            )

    return app
