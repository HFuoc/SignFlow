"""Job lifecycle tests use controlled services; real ML is a separate smoke path."""
from dataclasses import replace
import threading
import time
from types import SimpleNamespace

import pytest
from starlette.testclient import TestClient
from app.desktop_collector.recognition.contracts import MODEL, PredictionResult, RecognitionError
from app.desktop_collector.recognition.jobs import RecognitionJobService, RecognitionCatalog
from app.desktop_collector.recognition.service import RecognitionService
from app.desktop_collector.recognition.worker_client import WorkerConfig
from app.desktop_collector.server import create_app


class FakeService:
    def __init__(self, code=None):
        self.started = threading.Event()
        self.release = threading.Event()
        self.stopped = threading.Event()
        self.code = code

    def recognize(self, sample, provider, *, cancel_event):
        self.started.set()
        while not self.release.wait(.01):
            if cancel_event.is_set():
                self.stopped.set()
                return PredictionResult(request_id="test", sample_id=sample, error_code="cancelled")
        self.stopped.set()
        return PredictionResult(request_id="test", sample_id=sample, status="error" if self.code else "ok",
                                error_code=self.code)


def make_jobs(code=None):
    service = FakeService(code)
    jobs = RecognitionJobService(service, max_pending=2, max_history=2)
    jobs.catalog = SimpleNamespace(validate=lambda *args: None, models=lambda: [{"provider_id": MODEL.provider_id}], samples=lambda: [])
    return jobs, service


def wait(jobs, job, state, owner="a"):
    deadline = time.monotonic() + 3
    while time.monotonic() < deadline:
        result = jobs.get(owner, job["job_id"])
        if result["status"] == state:
            return result
        time.sleep(.01)
    pytest.fail(f"Expected {state}: {result}")


def test_queue_success_isolation_and_immutability():
    jobs, service = make_jobs()
    first = jobs.submit("a", "sample", MODEL.provider_id)
    second = jobs.submit("b", "sample", MODEL.provider_id)
    assert first["status"] == second["status"] == "queued"
    assert first["job_id"] != second["job_id"]
    with pytest.raises(RecognitionError, match="not found"):
        jobs.get("b", first["job_id"])
    with pytest.raises(RecognitionError):
        jobs.submit("a", "sample", MODEL.provider_id)
    with pytest.raises(RecognitionError):
        jobs.submit("a", "extra", MODEL.provider_id)
    jobs.start()
    assert service.started.wait(1)
    assert jobs.get("b", second["job_id"])["status"] == "queued"
    assert jobs.cancel("b", second["job_id"])["status"] == "cancelled"
    service.release.set()
    terminal = wait(jobs, first, "succeeded")
    assert terminal["started_at"] and terminal["finished_at"]
    assert jobs.cancel("a", first["job_id"]) == terminal
    terminal["prediction"]["status"] = "mutated"
    assert jobs.get("a", first["job_id"])["prediction"]["status"] == "ok"
    jobs.shutdown()


@pytest.mark.parametrize("code", ["worker_timeout", "worker_exit", "worker_protocol", "missing_asset",
                                  "cuda_memory", "host_memory"])
def test_failure(code):
    jobs, service = make_jobs(code)
    job = jobs.submit("a", "sample", MODEL.provider_id)
    service.release.set()
    jobs.start()
    error = wait(jobs, job, "failed")["error"]
    assert error["code"] == code
    if code in ("cuda_memory", "host_memory"):
        from app.desktop_collector.recognition.runtime_errors import MESSAGES
        assert error["message"] == MESSAGES[code]
    jobs.shutdown()


@pytest.mark.parametrize("shutdown", [False, True])
def test_running_cancel_and_shutdown(shutdown):
    jobs, service = make_jobs()
    job = jobs.submit("a", "sample", MODEL.provider_id)
    queued = jobs.submit("a", "other", MODEL.provider_id)
    jobs.start()
    assert service.started.wait(1)
    if shutdown:
        jobs.shutdown()
        assert jobs.get("a", queued["job_id"])["status"] == "cancelled"
    else:
        result = jobs.cancel("a", job["job_id"])
        assert result["cancel_requested"]
        wait(jobs, job, "cancelled")
        jobs.shutdown()
    assert service.stopped.is_set()
    assert jobs.get("a", job["job_id"])["status"] == "cancelled"
    assert not jobs._thread.is_alive()
    with pytest.raises(RecognitionError):
        jobs.submit("a", "new", MODEL.provider_id)


def test_optional_environment_unavailable(tmp_path):
    catalog = RecognitionCatalog(RecognitionService(WorkerConfig(workspace=tmp_path)))
    assert catalog.models()[0]["availability"] == "unavailable"
    with pytest.raises(RecognitionError):
        catalog.samples()
    with pytest.raises(RecognitionError) as error:
        catalog.validate("kvsl:do_vat:W00395", "other")
    assert error.value.code == "unsupported_provider"


def test_cleanup_failure_does_not_falsely_report_cancelled():
    jobs, service = make_jobs()
    def fail_cleanup(sample, provider, *, cancel_event):
        service.started.set()
        assert cancel_event.wait(2)
        raise RuntimeError("Process teardown could not be verified")
    service.recognize = fail_cleanup
    job = jobs.submit("a", "sample", MODEL.provider_id)
    jobs.start()
    assert service.started.wait(1)
    jobs.cancel("a", job["job_id"])
    assert wait(jobs, job, "failed")["error"]["code"] == "backend_error"
    jobs.shutdown()


def test_routes_security_and_lifecycle(tmp_path):
    origin = "http://127.0.0.1:43123"
    app = create_app(session_token="test-only", port=43123, allowed_origins=(origin,),
                     development=True, database_path=tmp_path / "identity.sqlite3")
    jobs = app.state.runtime.recognition
    fake = FakeService()
    jobs.service = fake
    jobs.catalog = SimpleNamespace(validate=lambda *a: None, models=lambda: [{"provider_id": MODEL.provider_id}], samples=lambda: [])
    headers = {"Authorization": "Bearer test-only", "Origin": origin}
    with TestClient(app, base_url=origin) as client:
        base = "/api/v1/recognition"
        for route in ("models", "samples", "jobs", "jobs/unknown"):
            assert client.get(base + "/" + route).status_code == 401
            assert client.get(base + "/" + route, headers=headers).status_code == 401
        password = "Test only password 2026"
        assert client.post("/api/v1/auth/setup", headers=headers, json={"username": "admin",
            "password": password, "password_confirmation": password}).status_code == 201
        assert client.get(base + "/models", headers=headers).json()["models"][0]["provider_id"] == MODEL.provider_id
        assert client.get(base + "/samples", headers=headers).json() == {"samples": []}
        payload = {"sample_id": "kvsl:do_vat:W00395", "provider_id": MODEL.provider_id}
        for key in ("video_path", "checkpoint_path", "python_path", "command"):
            assert client.post(base + "/jobs", headers=headers, json={**payload, key: "bad"}).status_code == 422
        assert client.post(base + "/jobs", headers={"Authorization": "Bearer test-only"}, json=payload).status_code == 403
        assert client.get(base + "/models", headers={**headers, "Host": "evil"}).status_code == 400
        assert client.get(base + "/models", headers={**headers, "Origin": "http://evil"}).status_code == 403
        preflight = client.options(base + "/jobs/x", headers={"Origin": origin})
        assert "DELETE" in preflight.headers["access-control-allow-methods"]
        response = client.post(base + "/jobs", headers=headers, json=payload)
        assert response.status_code == 202
        job_id = response.json()["job_id"]
        assert fake.started.wait(1)
        assert client.get("/api/v1/health").status_code == 200
        assert client.delete(base + "/jobs/unknown", headers=headers).status_code == 404
        assert client.delete(base + "/jobs/" + job_id, headers=headers).status_code == 200
        client.cookies.clear()
        assert client.post("/api/v1/auth/login", headers=headers,
                           json={"username": "admin", "password": password}).status_code == 200
        assert client.get(base + "/jobs/" + job_id, headers=headers).status_code == 404
        assert client.delete(base + "/jobs/" + job_id, headers=headers).status_code == 404
        assert client.get(base + "/jobs", headers=headers).json() == {"jobs": []}
    assert fake.stopped.is_set()
    assert not jobs._thread.is_alive()


# Reuse the existing synthetic manifest fixture, never real video in ordinary tests.
from test_recognition import sample


def test_catalog_supported_listing_and_invalid_ids(sample):
    manifest, path, assets, config = sample
    catalog = RecognitionCatalog(RecognitionService(config))
    listing = catalog.samples()
    assert len(listing) == 1
    assert listing[0]["display_label"] == "nhãn 7"
    assert not listing[0]["supported"] and listing[0]["asset_status"] == "valid"
    # A valid video alone cannot make a missing runtime/model runnable.
    assert str(assets) not in str(listing)
    for identity, code in [("missing", "unknown_sample"), ("kvsl:other:W00395", "unsupported_topic"),
                           ("kvsl:do_vat:missing", "unknown_sample")]:
        with pytest.raises(RecognitionError) as error:
            catalog.validate(identity, MODEL.provider_id)
        assert error.value.code == code
    (assets / "W00395.mp4").unlink()
    assert catalog.samples()[0]["supported"] is False


def test_history_bounded_and_terminal_cleanup():
    jobs, service = make_jobs()
    for index in range(5):
        job = jobs.submit("a", str(index), MODEL.provider_id)
        jobs.cancel("a", job["job_id"])
    assert len(jobs.list("a")) == 2
    jobs.shutdown()


def test_shell_shutdown_bounds_pending_request_and_closes_identity(tmp_path):
    import asyncio
    import socket
    import httpx
    from app.desktop_collector.shell import LoopbackServer
    server = LoopbackServer(database_path=tmp_path / "shutdown.sqlite3")
    entered = threading.Event()

    @server.app.get("/test-pending")
    async def pending():
        entered.set()
        await asyncio.sleep(30)
        return {"done": True}

    server.app.router.routes.insert(0, server.app.router.routes.pop())
    outcomes = []
    def request():
        try:
            outcomes.append(httpx.get(server.origin + "/test-pending", timeout=10).status_code)
        except httpx.HTTPError:
            outcomes.append("closed")

    server.start()
    client = threading.Thread(target=request, daemon=True)
    client.start()
    started = time.monotonic()
    try:
        assert entered.wait(3)
        started = time.monotonic()
        server.shutdown()
        assert time.monotonic() - started < 5
        assert not server.is_alive
        assert server.app.state.runtime.identity_repository._connection is None
        with socket.socket() as check:
            check.bind(("127.0.0.1", server.port))
    finally:
        server.shutdown()
        client.join(5)
    assert not client.is_alive()
