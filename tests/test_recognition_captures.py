"""Synthetic media exercises ownership/cleanup; actual decoding has a separate real-worker probe."""
from types import SimpleNamespace
import pytest
from starlette.testclient import TestClient
from app.desktop_collector.recognition.captures import CaptureStore, capture_path, MAX_CAPTURE_BYTES
from app.desktop_collector.recognition.contracts import MODEL, RecognitionError
from app.desktop_collector.recognition.jobs import RecognitionJobService
from app.desktop_collector.server import create_app
from test_recognition_jobs import FakeService, wait

MEDIA = b'\x1a\x45\xdf\xa3synthetic-invalid-media'

class CaptureService(FakeService):
    def __init__(self, code=None):
        super().__init__(code)
        self.captures = CaptureStore()
    def recognize(self, sample, provider, *, cancel_event, capture_id):
        assert sample is None
        assert capture_path(self.captures.root, capture_id).exists()
        return super().recognize(sample, provider, cancel_event=cancel_event)

@pytest.mark.parametrize('terminal', ['success', 'failure', 'cancel', 'shutdown', 'queued_cancel'])
def test_capture_terminal_cleanup_and_recapture(terminal):
    service = CaptureService('video_decode' if terminal == 'failure' else None)
    jobs = RecognitionJobService(service)
    try:
        job = jobs.submit_capture('owner', MEDIA, MODEL.provider_id)
        assert job['sample_id'] is None and job['source_kind'] == 'live_camera_capture'
        with pytest.raises(RecognitionError): jobs.get('other', job['job_id'])
        with pytest.raises(RecognitionError): jobs.cancel('other', job['job_id'])
        with pytest.raises(RecognitionError): jobs.submit_capture('owner', MEDIA, MODEL.provider_id)
        assert len(list(service.captures.root.iterdir())) == 1
        if terminal == 'queued_cancel': jobs.cancel('owner', job['job_id'])
        else:
            jobs.start(); assert service.started.wait(1)
            if terminal == 'shutdown': jobs.shutdown()
            elif terminal == 'cancel': jobs.cancel('owner', job['job_id'])
            else: service.release.set()
        state = {'success':'succeeded', 'failure':'failed'}.get(terminal, 'cancelled')
        wait(jobs, job, state, owner='owner')
        assert not list(service.captures.root.iterdir())
        if terminal != 'shutdown':
            again = jobs.submit_capture('owner', MEDIA, MODEL.provider_id)
            assert again['capture_id'] != job['capture_id']
            jobs.cancel('owner', again['job_id'])
    finally:
        jobs.shutdown(); service.captures.close()

@pytest.mark.parametrize('identity', ['../bad', '/tmp/a', 'C:\\video.webm', 'kvsl:do_vat:W00395', 'x'*32, '', None])
def test_capture_identity_rejects_paths(tmp_path, identity):
    with pytest.raises(RecognitionError): capture_path(tmp_path, identity)

def test_capture_store_format_size_close():
    store = CaptureStore()
    root = store.root
    for data in [b'', b'not video', b'x'*(MAX_CAPTURE_BYTES+1)]:
        with pytest.raises(RecognitionError): store.create(data)
    assert not list(root.iterdir())
    store.create(MEDIA); store.close()
    assert not root.exists()
    store.delete('a' * 32)  # Job completion may arrive after service shutdown removed the root.
    with pytest.raises(RecognitionError): store.create(MEDIA)

def test_capture_api_security(tmp_path):
    origin='http://127.0.0.1:43123'
    app=create_app(session_token='test-only', port=43123, allowed_origins=(origin,), development=True,
                   database_path=tmp_path/'identity.sqlite3')
    jobs=app.state.runtime.recognition
    jobs.service.shutdown()
    service=CaptureService()
    jobs.service=service
    jobs.catalog=SimpleNamespace(models=lambda:[{'provider_id':MODEL.provider_id, 'topic_id':'do_vat', 'availability':'available'}])
    headers={'Authorization':'Bearer test-only', 'Origin':origin, 'Content-Type':'video/webm'}
    route='/api/v1/recognition/live-jobs?topic_id=do_vat'
    try:
        with TestClient(app,base_url=origin) as client:
            assert client.post(route,content=MEDIA).status_code==403
            assert client.post(route,headers={'Origin':origin},content=MEDIA).status_code==401
            assert client.post(route,headers=headers,content=MEDIA).status_code==401
            auth={k:v for k,v in headers.items() if k!='Content-Type'}
            password='Camera test passphrase 2026'
            assert client.post('/api/v1/auth/setup',headers=auth,json={'username':'admin','password':password,'password_confirmation':password}).status_code==201
            for changed, status in [({'Origin':'http://evil'},403),({'Host':'evil'},400),({'Content-Type':'video/mp4'},415),({'Content-Length':str(MAX_CAPTURE_BYTES+1)},413)]:
                assert client.post(route,headers={**headers,**changed},content=MEDIA).status_code==status
            assert client.post(route+'&video_path=../x',headers=headers,content=MEDIA).status_code==422
            assert client.post(route.replace('do_vat','unknown'),headers=headers,content=MEDIA).status_code==422
            assert client.post(route,headers=headers,content=b'bad').status_code==415
            response=client.post(route,headers=headers,content=MEDIA)
            assert response.status_code==202
            job=response.json(); assert job['sample_id'] is None
            assert 'path' not in response.text and 'Temp' not in response.text
            assert service.started.wait(1)
            client.cookies.clear()
            assert client.post('/api/v1/auth/login',headers=auth,json={'username':'admin','password':password}).status_code==200
            for method in [client.get,client.delete]:
                assert method('/api/v1/recognition/jobs/'+job['job_id'],headers=auth).status_code==404
        assert not list(service.captures.root.iterdir())
        assert not jobs._thread.is_alive()
    finally: service.captures.close()
