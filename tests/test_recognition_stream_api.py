"""Real ASGI authentication/lifecycle with a controlled, non-ML stream worker."""
import threading
import time

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.desktop_collector.recognition.contracts import RecognitionError
from app.desktop_collector.server import create_app
from test_recognition_stream import packet, png

ORIGIN = "http://127.0.0.1:43123"
ENDPOINT = "ws://127.0.0.1:43123/api/v1/recognition/stream"
HEADERS = {"Origin": ORIGIN, "Authorization": "Bearer test-stream-only"}
PASSWORD = "Stream test local password"


class ControlledWorker:
    def __init__(self, control, stream_id):
        self.control, self.stream_id = control, stream_id
        self.closed = threading.Event()
        self.frames = []

    def exchange(self, header=None, png=None, cancel_event=None):
        operation = "startup" if header is None else "frame"
        self.control["entered"].set()
        if self.control["block"] == operation:
            assert cancel_event.wait(3), "Pending operation did not observe cancellation"
        if cancel_event.is_set():
            self.control["cancelled"].set()
            raise RecognitionError("cancelled", "Stream stopped")
        if header is not None:
            self.frames.append(header)
            return {**header, "state": "ready", "phase": None, "segment_id": 0,
                    "prediction": None, "quality": {}}

    def shutdown(self):
        self.closed.set()


@pytest.fixture
def camera(tmp_path):
    app = create_app(session_token="test-stream-only", port=43123,
                     allowed_origins=(ORIGIN,), database_path=tmp_path / "stream.sqlite3")
    runtime = app.state.runtime
    control = {"block": None, "entered": threading.Event(), "cancelled": threading.Event(), "workers": []}
    def factory(config, stream_id, model=None):
        worker = ControlledWorker(control, stream_id)
        worker.model = model
        control["workers"].append(worker)
        return worker
    runtime.recognition_streams.factory = factory
    with TestClient(app, base_url=ORIGIN) as client:
        response = client.post("/api/v1/auth/setup", headers=HEADERS, json={
            "username": "stream-admin", "password": PASSWORD, "password_confirmation": PASSWORD})
        assert response.status_code == 201
        yield client, runtime, control
    assert runtime.recognition_streams.active is None
    assert runtime.recognition.service._mode_owner is None
    assert all(worker.closed.is_set() for worker in control["workers"])


def authenticate(socket):
    socket.send_json({"type": "authenticate", "token": "test-stream-only"})


def test_explicit_gpu_provider_and_invalid_provider_are_authenticated(camera):
    client, runtime, control = camera
    with client.websocket_connect(ENDPOINT, headers={'Origin': ORIGIN}) as socket:
        socket.send_json({'type': 'authenticate', 'token': 'test-stream-only', 'provider_id': 'visign-videomae-25'})
        ready = socket.receive_json()
        assert ready['provider_id'] == 'visign-videomae-25'
        assert control['workers'][-1].model.provider_id == 'visign-videomae-25'
        socket.send_json({'type': 'stop'})
    released(runtime)
    count = len(control['workers'])
    with client.websocket_connect(ENDPOINT, headers={'Origin': ORIGIN}) as socket:
        socket.send_json({'type': 'authenticate', 'token': 'test-stream-only', 'provider_id': '../../unknown'})
        assert socket.receive_json()['code'] == 'unsupported_provider'
    assert len(control['workers']) == count


def released(runtime):
    deadline = time.monotonic() + 1
    while runtime.recognition_streams.active is not None and time.monotonic() < deadline:
        time.sleep(.005)
    assert runtime.recognition_streams.active is None
    assert not runtime.hub._clients and not runtime.hub._on_close


def test_stream_does_not_interrupt_an_existing_prediction(camera):
    client, runtime, control = camera
    runtime.recognition.service.reserve_stream('manual-operation')
    try:
        with client.websocket_connect(ENDPOINT, headers={'Origin': ORIGIN}) as socket:
            authenticate(socket)
            assert socket.receive_json()['code'] == 'recognition_busy'
        released(runtime)
        assert runtime.recognition.service._mode_owner == 'manual-operation'
        assert not control['entered'].is_set()
    finally:
        runtime.recognition.service.release_stream('manual-operation')


@pytest.mark.parametrize("headers,path", [
    ({"Origin": ORIGIN, "Host": "localhost:43123"}, ENDPOINT),
    ({"Origin": ORIGIN, "Host": "127.0.0.1:43124"}, ENDPOINT),
    ({"Origin": ORIGIN + "/"}, ENDPOINT),
    ({"Origin": "http://evil.invalid"}, ENDPOINT),
    ({}, ENDPOINT),
    ({"Origin": ORIGIN}, ENDPOINT + "?token=forbidden"),
])
def test_exact_host_origin_and_no_query_before_accept(camera, headers, path):
    client, runtime, control = camera
    with pytest.raises(WebSocketDisconnect) as error:
        with client.websocket_connect(path, headers=headers):
            pytest.fail("Untrusted origin/host/query was accepted")
    assert error.value.code == 1008
    assert not control["workers"]


@pytest.mark.parametrize("payload", [{}, {"type": "authenticate", "token": "wrong"},
                                      {"type": "authenticate", "token": "test-stream-only", "path": "forbidden"}])
def test_token_is_required_before_worker_allocation(camera, payload):
    client, runtime, control = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        socket.send_json(payload)
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 1008
    assert not control["workers"]


def test_user_session_required_in_addition_to_bridge_token(camera):
    client, runtime, control = camera
    client.cookies.clear()
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 4401
    assert not control["workers"]


@pytest.mark.parametrize("role", ["developer", "researcher", "participant"])
def test_collector_role_and_password_change_gate(camera, role):
    client, runtime, control = camera
    assert client.post("/api/v1/admin/users", headers=HEADERS, json={
        "username": role, "password": PASSWORD, "role": role}).status_code == 201
    client.cookies.clear()
    assert client.post("/api/v1/auth/login", headers=HEADERS,
                       json={"username": role, "password": PASSWORD}).status_code == 200
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 4403
    assert not control["workers"]
    permanent = "Permanent stream test password"
    assert client.post("/api/v1/auth/change-password", headers=HEADERS, json={
        "current_password": PASSWORD, "new_password": permanent,
        "new_password_confirmation": permanent}).status_code == 200
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        if role == "participant":
            with pytest.raises(WebSocketDisconnect) as error:
                socket.receive_json()
            assert error.value.code == 4403
            assert not control["workers"]
        else:
            assert socket.receive_json()["type"] == "ready"
            socket.send_json({"type": "stop"})
            with pytest.raises(WebSocketDisconnect) as error:
                socket.receive_json()
            assert error.value.code == 1000


def test_single_stream_acknowledgements_cleanup_and_reconnect(camera):
    client, runtime, control = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as first:
        authenticate(first)
        initial = first.receive_json()
        assert initial["type"] == "ready" and initial["max_fps"] == 60
        assert initial["frame_formats"] == ["rgba8", "png"]
        with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as second:
            authenticate(second)
            assert second.receive_json()["code"] == "stream_busy"
            with pytest.raises(WebSocketDisconnect):
                second.receive_json()
        first.send_bytes(packet())
        assert first.receive_json()["sequence"] == 0
        assert client.get("/api/v1/health").status_code == 200
    released(runtime)
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        assert socket.receive_json()["stream_id"] != initial["stream_id"]
    released(runtime)
    assert len(control["workers"]) == 2


@pytest.mark.parametrize("operation", ["startup", "frame"])
@pytest.mark.parametrize("stop", [False, True])
def test_disconnect_or_stop_cancels_pending_work(camera, operation, stop):
    client, runtime, control = camera
    control["block"] = operation
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        if operation == "frame":
            socket.receive_json()
            control["entered"].clear()
            socket.send_bytes(packet())
        assert control["entered"].wait(1)
        if stop:
            socket.send_json({"type": "stop"})
            with pytest.raises(WebSocketDisconnect) as error:
                socket.receive_json()
            assert error.value.code == 1000
    released(runtime)
    assert control["cancelled"].is_set() and control["workers"][0].closed.is_set()


@pytest.mark.parametrize("operation", ["startup", "frame"])
def test_frames_cannot_queue_behind_pending_work(camera, operation):
    client, runtime, control = camera
    control["block"] = operation
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        if operation == "frame":
            socket.receive_json()
            control["entered"].clear()
            socket.send_bytes(packet())
        assert control["entered"].wait(1)
        socket.send_bytes(packet(1, 100))
        assert socket.receive_json()["code"] == "stream_backpressure"
        with pytest.raises(WebSocketDisconnect):
            socket.receive_json()
    released(runtime)
    assert control["cancelled"].is_set() and not control["workers"][0].frames


@pytest.mark.parametrize("operation", ["idle", "startup", "frame"])
@pytest.mark.parametrize("action", ["logout", "shutdown"])
def test_revocation_and_shutdown_release_even_without_peer_disconnect(camera, operation, action):
    client, runtime, control = camera
    control["block"] = operation
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        if operation != "startup":
            socket.receive_json()
            if operation == "frame":
                control["entered"].clear()
                socket.send_bytes(packet())
        assert control["entered"].wait(1)
        if action == "logout":
            assert client.post("/api/v1/auth/logout", headers=HEADERS).status_code == 200
        else:
            client.portal.call(runtime.hub.close_all)
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == (4401 if action == "logout" else 1001)
        released(runtime)  # Peer deliberately has not sent websocket.disconnect yet.
        assert control["workers"][0].closed.is_set()


@pytest.mark.parametrize("image,code", [(b"bad png", "stream_size"), (png(8192, 8192), "stream_media")])
def test_invalid_images_never_reach_worker(camera, image, code):
    client, runtime, control = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        socket.receive_json()
        socket.send_bytes(packet(image=image))
        assert socket.receive_json()["code"] == code
        with pytest.raises(WebSocketDisconnect):
            socket.receive_json()
    released(runtime)
    assert not control["workers"][0].frames


def test_idle_timeout_closes_and_releases(camera, monkeypatch):
    from app.desktop_collector.server import recognition_stream
    monkeypatch.setattr(recognition_stream, "IDLE_TIMEOUT_S", .05)
    client, runtime, _ = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        socket.receive_json()
        assert socket.receive_json()["code"] == "stream_timeout"
        with pytest.raises(WebSocketDisconnect):
            socket.receive_json()
    released(runtime)


def test_session_lifetime_expires_before_idle_timeout(camera, monkeypatch):
    from app.desktop_collector.server import recognition_stream
    monkeypatch.setattr(recognition_stream, "SESSION_TIMEOUT_S", .05)
    client, runtime, _ = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        socket.receive_json()
        socket.send_bytes(packet())
        assert socket.receive_json()["sequence"] == 0
        assert socket.receive_json()["code"] == "stream_timeout"
        with pytest.raises(WebSocketDisconnect):
            socket.receive_json()
    released(runtime)


def test_session_is_revalidated_before_each_frame(camera):
    client, runtime, control = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        authenticate(socket)
        socket.receive_json()
        # Invalidate persistence without a hub notification, as with expiry.
        runtime.auth.logout(client.cookies.get("smartglove_user_session"))
        socket.send_bytes(packet())
        with pytest.raises(WebSocketDisconnect) as error:
            socket.receive_json()
        assert error.value.code == 4401
    released(runtime)
    assert not control["workers"][0].frames


@pytest.mark.parametrize("text", ["not JSON", '{"type":"authenticate","type":"stop"}', "x" * 4097],
                         ids=["invalid-json", "duplicate-keys", "oversized-control"])
def test_bad_authentication_controls_are_bounded(camera, text):
    client, runtime, control = camera
    with client.websocket_connect(ENDPOINT, headers={"Origin": ORIGIN}) as socket:
        socket.send_text(text)
        assert socket.receive_json()["code"] == "stream_protocol"
        with pytest.raises(WebSocketDisconnect):
            socket.receive_json()
    assert not control["workers"]
