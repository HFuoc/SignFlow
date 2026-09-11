from __future__ import annotations

import logging
import socket
import time
from pathlib import Path

import httpx
import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from websockets.exceptions import ConnectionClosed
from websockets.sync.client import connect as websocket_connect

import app.desktop_collector.shell as shell_module
from app.desktop_collector.persistence import PersistenceStartupError
from app.desktop_collector.server import create_app
from app.desktop_collector.shell import LoopbackServer


PORT = 43123
ORIGIN = f"http://127.0.0.1:{PORT}"
TOKEN = "ephemeral-test-token-never-log"
ADMIN_PASSWORD = "correct horse battery staple"


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    app = create_app(
        session_token=TOKEN,
        port=PORT,
        allowed_origins=(ORIGIN,),
        development=False,
        database_path=tmp_path / "identity.sqlite3",
    )
    with TestClient(app, base_url=ORIGIN) as test_client:
        yield test_client


def auth_headers(token: str = TOKEN, origin: str = ORIGIN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Origin": origin}


def setup_admin(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/auth/setup",
        headers=auth_headers(),
        json={
            "username": "administrator",
            "display_name": "Local owner",
            "password": ADMIN_PASSWORD,
            "password_confirmation": ADMIN_PASSWORD,
        },
    )
    assert response.status_code == 201
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=strict" in cookie
    assert "Secure" not in cookie
    return response.json()


def login(client: TestClient, username: str, password: str) -> dict[str, object]:
    client.cookies.clear()
    response = client.post(
        "/api/v1/auth/login",
        headers=auth_headers(),
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    assert "smartglove_user_session" not in response.text
    return response.json()


def test_health_is_public_and_minimal(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize("authorization", [None, "Bearer wrong-token"])
def test_protected_request_rejects_missing_or_wrong_token(
    client: TestClient, authorization: str | None
) -> None:
    headers = {"Origin": ORIGIN}
    if authorization:
        headers["Authorization"] = authorization
    response = client.get("/api/v1/bootstrap", headers=headers)
    assert response.status_code == 401


def test_invalid_origin_and_host_are_rejected(client: TestClient) -> None:
    invalid_origin = client.get(
        "/api/v1/bootstrap",
        headers=auth_headers(origin="http://evil.invalid"),
    )
    invalid_host = client.get(
        "/api/v1/bootstrap",
        headers={**auth_headers(), "Host": "localhost:43123"},
    )
    assert invalid_origin.status_code == 403
    assert invalid_host.status_code == 400


@pytest.mark.parametrize(
    "origin",
    [
        "http://127.0.0.1:5173/",
        "http://127.0.0.1:5173.evil.invalid",
        "http://user@127.0.0.1:5173",
        "https://127.0.0.1:5173",
    ],
)
def test_app_rejects_noncanonical_loopback_origin_configuration(
    tmp_path: Path, origin: str
) -> None:
    with pytest.raises(ValueError, match="explicit IPv4 loopback origins"):
        create_app(
            session_token=TOKEN,
            port=PORT,
            allowed_origins=(origin,),
            database_path=tmp_path / "identity.sqlite3",
        )


def test_development_cors_is_exact_and_does_not_disable_authentication(tmp_path: Path) -> None:
    dev_origin = "http://127.0.0.1:5173"
    app = create_app(
        session_token=TOKEN,
        port=PORT,
        allowed_origins=(ORIGIN, dev_origin),
        development=True,
        database_path=tmp_path / "identity.sqlite3",
    )
    with TestClient(app, base_url=ORIGIN) as dev_client:
        unauthorized = dev_client.get("/api/v1/bootstrap", headers={"Origin": dev_origin})
        authorized = dev_client.get("/api/v1/bootstrap", headers=auth_headers(origin=dev_origin))
    assert unauthorized.status_code == 401
    assert authorized.headers["access-control-allow-origin"] == dev_origin
    assert authorized.headers["access-control-allow-origin"] != "*"


def test_state_change_requires_origin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/devices/SIM-GLOVE-L/connect",
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    assert response.status_code == 403


def test_validation_errors_never_echo_password_input(client: TestClient) -> None:
    marker = "private-validation-secret"
    oversized = marker + ("x" * 1_100)
    response = client.post(
        "/api/v1/auth/setup",
        headers=auth_headers(),
        json={
            "username": "administrator",
            "password": oversized,
            "password_confirmation": oversized,
        },
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "invalid request", "code": "invalid_request"}
    assert marker not in response.text


def test_setup_status_login_logout_and_generic_failure_contract(client: TestClient) -> None:
    initial = client.get("/api/v1/auth/status", headers=auth_headers())
    assert initial.json() == {"setup_required": True, "authenticated": False, "user": None}
    assert initial.headers["cache-control"] == "no-store"
    assert "frame-ancestors 'none'" in initial.headers["content-security-policy"]
    setup = setup_admin(client)
    assert setup["authenticated"] is True
    assert setup["user"]["role"] == "administrator"  # type: ignore[index]
    assert ADMIN_PASSWORD not in repr(setup)
    assert "password_hash" not in repr(setup)
    disabled_setup = client.post(
        "/api/v1/auth/setup",
        headers=auth_headers(),
        json={
            "username": "second-admin",
            "password": ADMIN_PASSWORD,
            "password_confirmation": ADMIN_PASSWORD,
        },
    )
    assert disabled_setup.status_code == 409

    client.cookies.clear()
    unknown = client.post(
        "/api/v1/auth/login",
        headers=auth_headers(),
        json={"username": "missing", "password": ADMIN_PASSWORD},
    )
    wrong = client.post(
        "/api/v1/auth/login",
        headers=auth_headers(),
        json={"username": "administrator", "password": "wrong passphrase value"},
    )
    assert (unknown.status_code, unknown.json()) == (wrong.status_code, wrong.json())
    login(client, "administrator", ADMIN_PASSWORD)
    restored = client.get("/api/v1/auth/status", headers=auth_headers())
    assert restored.json()["authenticated"] is True
    logout = client.post("/api/v1/auth/logout", headers=auth_headers())
    assert logout.status_code == 200
    assert "Max-Age=0" in logout.headers["set-cookie"]
    assert client.get("/api/v1/bootstrap", headers=auth_headers()).status_code == 401


def test_backend_role_matrix_and_forced_password_change(client: TestClient) -> None:
    setup_admin(client)
    role_sessions: dict[str, str] = {
        "administrator": client.cookies.get("smartglove_user_session"),  # type: ignore[dict-item]
    }
    passwords: dict[str, tuple[str, str]] = {}
    for role in ("developer", "researcher", "participant"):
        temporary = f"temporary password for {role}"
        permanent = f"permanent password for {role}"
        response = client.post(
            "/api/v1/admin/users",
            headers=auth_headers(),
            json={
                "username": role,
                "display_name": role.title(),
                "password": temporary,
                "role": role,
            },
        )
        assert response.status_code == 201
        passwords[role] = (temporary, permanent)

    for role, (temporary, permanent) in passwords.items():
        login(client, role, temporary)
        blocked = client.get("/api/v1/bootstrap", headers=auth_headers())
        assert blocked.status_code == 403
        assert blocked.json()["code"] == "password_change_required"
        changed = client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers(),
            json={
                "current_password": temporary,
                "new_password": permanent,
                "new_password_confirmation": permanent,
            },
        )
        assert changed.status_code == 200
        role_sessions[role] = client.cookies.get("smartglove_user_session")  # type: ignore[assignment]

    for role, credential in role_sessions.items():
        client.cookies.clear()
        client.cookies.set("smartglove_user_session", credential)
        collector_responses = (
            client.get("/api/v1/bootstrap", headers=auth_headers()),
            client.post("/api/v1/devices/SIM-GLOVE-L/connect", headers=auth_headers()),
            client.post("/api/v1/devices/SIM-GLOVE-L/disconnect", headers=auth_headers()),
            client.put(
                "/api/v1/simulator/config",
                headers=auth_headers(),
                json={"seed": 2026, "sample_rate_hz": 50, "noise_std": 7, "packet_loss_rate": 0.01},
            ),
            client.get("/api/v1/telemetry/snapshot", headers=auth_headers()),
        )
        administration_responses = (
            client.get("/api/v1/admin/users", headers=auth_headers()),
            client.post(
                "/api/v1/admin/users",
                headers=auth_headers(),
                json={
                    "username": "matrix-created-user",
                    "password": "matrix temporary password",
                    "role": "participant",
                },
            ),
            client.patch(
                "/api/v1/admin/users/missing-user",
                headers=auth_headers(),
                json={"display_name": None, "role": "researcher", "is_active": True},
            ),
            client.post(
                "/api/v1/admin/users/missing-user/reset-password",
                headers=auth_headers(),
                json={"temporary_password": "matrix replacement password"},
            ),
            client.post(
                "/api/v1/admin/users/missing-user/revoke-sessions",
                headers=auth_headers(),
            ),
            client.get("/api/v1/admin/audit-events", headers=auth_headers()),
        )
        if role == "participant":
            assert {response.status_code for response in collector_responses} == {403}
        else:
            assert all(response.status_code == 200 for response in collector_responses)
        if role == "administrator":
            assert all(response.status_code != 403 for response in administration_responses)
        else:
            assert {response.status_code for response in administration_responses} == {403}


def test_administrator_management_revocation_audit_and_final_admin_protection(
    client: TestClient,
) -> None:
    setup = setup_admin(client)
    admin_id = setup["user"]["id"]  # type: ignore[index]
    created = client.post(
        "/api/v1/admin/users",
        headers=auth_headers(),
        json={
            "username": "managed-user",
            "display_name": "Managed user",
            "password": "temporary managed passphrase",
            "role": "researcher",
        },
    )
    assert created.status_code == 201
    user_id = created.json()["user"]["id"]
    updated = client.patch(
        f"/api/v1/admin/users/{user_id}",
        headers=auth_headers(),
        json={"display_name": "Managed developer", "role": "developer", "is_active": True},
    )
    assert updated.status_code == 200
    assert updated.json()["user"]["role"] == "developer"
    reset = client.post(
        f"/api/v1/admin/users/{user_id}/reset-password",
        headers=auth_headers(),
        json={"temporary_password": "replacement temporary passphrase"},
    )
    assert reset.status_code == 200
    assert reset.json()["user"]["must_change_password"] is True
    revoked = client.post(
        f"/api/v1/admin/users/{user_id}/revoke-sessions",
        headers=auth_headers(),
    )
    assert revoked.status_code == 200
    protected = client.patch(
        f"/api/v1/admin/users/{admin_id}",
        headers=auth_headers(),
        json={"display_name": "Local owner", "role": "researcher", "is_active": True},
    )
    assert protected.status_code == 409
    audit = client.get("/api/v1/admin/audit-events", headers=auth_headers())
    assert audit.status_code == 200
    event_types = {event["event_type"] for event in audit.json()["events"]}
    assert {"user_created", "role_changed", "password_reset", "session_revoked"}.issubset(event_types)


def test_user_session_is_required_for_websocket_after_bridge_auth(client: TestClient) -> None:
    setup_admin(client)
    client.cookies.clear()
    with client.websocket_connect(
        "/ws/v1/telemetry",
        headers={"Origin": ORIGIN, "Host": f"127.0.0.1:{PORT}"},
    ) as websocket:
        websocket.send_json({"type": "authenticate", "token": TOKEN})
        with pytest.raises(WebSocketDisconnect) as closed:
            websocket.receive_json()
    assert closed.value.code == 4401


def test_websocket_sends_no_telemetry_before_valid_auth(client: TestClient) -> None:
    with client.websocket_connect(
        "/ws/v1/telemetry", headers={"Origin": ORIGIN, "Host": f"127.0.0.1:{PORT}"}
    ) as websocket:
        websocket.send_json({"type": "authenticate", "token": "wrong"})
        with pytest.raises(WebSocketDisconnect) as closed:
            websocket.receive_json()
    assert closed.value.code == 1008


def test_websocket_rejects_invalid_origin_before_authentication(client: TestClient) -> None:
    with pytest.raises(WebSocketDisconnect) as closed:
        with client.websocket_connect(
            "/ws/v1/telemetry",
            headers={"Origin": "http://evil.invalid", "Host": f"127.0.0.1:{PORT}"},
        ):
            pass
    assert closed.value.code == 1008


def test_authenticated_websocket_receives_hello_and_batched_data(client: TestClient) -> None:
    setup_admin(client)
    connect = client.post(
        "/api/v1/devices/SIM-GLOVE-L/connect", headers=auth_headers()
    )
    assert connect.status_code == 200
    user_cookie = client.cookies.get("smartglove_user_session")
    with client.websocket_connect(
        "/ws/v1/telemetry",
        headers={
            "Origin": ORIGIN,
            "Host": f"127.0.0.1:{PORT}",
            "Cookie": f"smartglove_user_session={user_cookie}",
        },
    ) as websocket:
        websocket.send_json({"type": "authenticate", "token": TOKEN})
        hello = websocket.receive_json()
        assert hello["type"] == "hello"
        assert len(hello["channels"]) == 13
        deadline = time.monotonic() + 2.0
        batch = None
        while time.monotonic() < deadline:
            message = websocket.receive_json()
            if message["type"] == "telemetry_batch":
                batch = message
                break
        assert batch is not None
        assert batch["devices"][0]["device_id"] == "SIM-GLOVE-L"
        assert all(batch["devices"][0]["simulated"])
        assert len(batch["devices"][0]["values"]) == 13


def test_session_token_does_not_appear_in_application_logs(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.DEBUG)
    client.get("/api/v1/bootstrap", headers=auth_headers())
    assert TOKEN not in caplog.text


def test_loopback_server_uses_dynamic_port_and_idempotent_shutdown(tmp_path: Path) -> None:
    server = LoopbackServer(auto_connect=True, database_path=tmp_path / "identity.sqlite3")
    server.start()
    port = server.port
    assert server.healthcheck()
    assert server.is_alive
    assert server.app.state.runtime.controller.active_worker_count() == 2

    server.shutdown()
    server.shutdown()

    assert not server.is_alive
    assert server.app.state.runtime.controller.active_worker_count() == 0
    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe.settimeout(0.25)
    try:
        assert probe.connect_ex(("127.0.0.1", port)) != 0
    finally:
        probe.close()


def test_loopback_constructor_releases_port_on_persistence_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_port: list[int] = []

    def fail_create_app(**kwargs):  # type: ignore[no-untyped-def]
        captured_port.append(int(kwargs["port"]))
        raise PersistenceStartupError("Local account storage could not be initialized.")

    monkeypatch.setattr(shell_module, "create_app", fail_create_app)
    with pytest.raises(PersistenceStartupError, match="could not be initialized"):
        LoopbackServer()
    assert captured_port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        assert probe.connect_ex(("127.0.0.1", captured_port[0])) != 0


def test_shutdown_closes_authenticated_websocket(tmp_path: Path) -> None:
    server = LoopbackServer(
        auto_connect=True,
        database_path=tmp_path / "identity.sqlite3",
        _session_token_for_testing=TOKEN,
    )
    server.start()
    with httpx.Client(base_url=server.origin) as client:
        response = client.post(
            "/api/v1/auth/setup",
            headers=auth_headers(origin=server.origin),
            json={
                "username": "administrator",
                "display_name": "Local owner",
                "password": ADMIN_PASSWORD,
                "password_confirmation": ADMIN_PASSWORD,
            },
        )
        assert response.status_code == 201
        user_cookie = client.cookies.get("smartglove_user_session")
        assert user_cookie
    websocket = websocket_connect(
        f"ws://127.0.0.1:{server.port}/ws/v1/telemetry",
        origin=server.origin,
        open_timeout=2,
        additional_headers={"Cookie": f"smartglove_user_session={user_cookie}"},
    )
    websocket.send(f'{{"type":"authenticate","token":"{TOKEN}"}}')
    assert '"type":"hello"' in websocket.recv(timeout=2)

    server.shutdown()

    with pytest.raises(ConnectionClosed):
        websocket.recv(timeout=2)


def test_logout_and_role_loss_close_authenticated_websockets(tmp_path: Path) -> None:
    server = LoopbackServer(
        auto_connect=True,
        database_path=tmp_path / "identity.sqlite3",
        _session_token_for_testing=TOKEN,
    )
    server.start()
    try:
        with httpx.Client(base_url=server.origin) as admin_client:
            setup = admin_client.post(
                "/api/v1/auth/setup",
                headers=auth_headers(origin=server.origin),
                json={
                    "username": "administrator",
                    "display_name": "Local owner",
                    "password": ADMIN_PASSWORD,
                    "password_confirmation": ADMIN_PASSWORD,
                },
            )
            assert setup.status_code == 201
            admin_cookie = admin_client.cookies.get("smartglove_user_session")
            websocket = websocket_connect(
                f"ws://127.0.0.1:{server.port}/ws/v1/telemetry",
                origin=server.origin,
                additional_headers={"Cookie": f"smartglove_user_session={admin_cookie}"},
            )
            websocket.send(f'{{"type":"authenticate","token":"{TOKEN}"}}')
            assert '"type":"hello"' in websocket.recv(timeout=2)
            assert admin_client.post(
                "/api/v1/auth/logout", headers=auth_headers(origin=server.origin)
            ).status_code == 200
            with pytest.raises(ConnectionClosed):
                websocket.recv(timeout=2)

            login_response = admin_client.post(
                "/api/v1/auth/login",
                headers=auth_headers(origin=server.origin),
                json={"username": "administrator", "password": ADMIN_PASSWORD},
            )
            assert login_response.status_code == 200
            created = admin_client.post(
                "/api/v1/admin/users",
                headers=auth_headers(origin=server.origin),
                json={
                    "username": "socket-researcher",
                    "password": "temporary socket password",
                    "role": "researcher",
                },
            )
            researcher_id = created.json()["user"]["id"]

            with httpx.Client(base_url=server.origin) as researcher_client:
                assert researcher_client.post(
                    "/api/v1/auth/login",
                    headers=auth_headers(origin=server.origin),
                    json={
                        "username": "socket-researcher",
                        "password": "temporary socket password",
                    },
                ).status_code == 200
                assert researcher_client.post(
                    "/api/v1/auth/change-password",
                    headers=auth_headers(origin=server.origin),
                    json={
                        "current_password": "temporary socket password",
                        "new_password": "permanent socket password",
                        "new_password_confirmation": "permanent socket password",
                    },
                ).status_code == 200
                researcher_cookie = researcher_client.cookies.get("smartglove_user_session")

            researcher_socket = websocket_connect(
                f"ws://127.0.0.1:{server.port}/ws/v1/telemetry",
                origin=server.origin,
                additional_headers={"Cookie": f"smartglove_user_session={researcher_cookie}"},
            )
            researcher_socket.send(f'{{"type":"authenticate","token":"{TOKEN}"}}')
            assert '"type":"hello"' in researcher_socket.recv(timeout=2)
            demoted = admin_client.patch(
                f"/api/v1/admin/users/{researcher_id}",
                headers=auth_headers(origin=server.origin),
                json={"display_name": None, "role": "participant", "is_active": True},
            )
            assert demoted.status_code == 200
            with pytest.raises(ConnectionClosed):
                researcher_socket.recv(timeout=2)
    finally:
        server.shutdown()
