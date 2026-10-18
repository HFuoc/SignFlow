"""Lightweight real processes exercise IPC/lifecycle; no fake output is ML evidence."""
from dataclasses import replace
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

import pytest

from app.desktop_collector.recognition import persistent_client, worker
from app.desktop_collector.recognition.contracts import MODEL, RecognitionError
from app.desktop_collector.recognition.persistent_client import PersistentRecognitionWorkerClient
from app.desktop_collector.recognition.worker_client import WorkerConfig

SCRIPT = r'''
import json,os,sys,time
from app.desktop_collector.recognition.contracts import PERSISTENT_PROTOCOL,WORKER_IDENTITY,WORKER_VERSION
from app.desktop_collector.recognition.registry import runtime_providers
mode,hello_id=sys.argv[1:]
hello=dict(protocol_version=PERSISTENT_PROTOCOL,request_id=hello_id,status='ready',
           worker_identity=WORKER_IDENTITY,worker_version=WORKER_VERSION,
           providers=runtime_providers(),runtime_ready=True,pid=os.getpid())
if mode.startswith('hello_'):
    field=mode.removeprefix('hello_')
    hello[field]=False if field=='runtime_ready' else 'invalid'
if mode=='startup_timeout': time.sleep(30)
if mode=='cuda_memory':
    print('SMARTGLOVE_WORKER_ERROR: cuda_memory /private/model/path',file=sys.stderr,flush=True)
    sys.exit(2)
print(json.dumps(hello),flush=True)
if mode=='no_read': time.sleep(30)
for line in sys.stdin:
    r=json.loads(line)
    if r['operation']=='shutdown':
        if mode=='shutdown_hang': time.sleep(30)
        break
    if mode=='crash': os._exit(7)
    if mode=='host_memory':
        print('OSError: [WinError 1455] private checkpoint path',file=sys.stderr,flush=True)
        sys.exit(2)
    if mode=='block': time.sleep(30)
    if mode=='malformed': print('not JSON',flush=True);continue
    if mode=='oversized': print('x'*131073,flush=True);continue
    print('harmless diagnostics',file=sys.stderr,flush=True)
    if mode=='stderr_flood':
        sys.stderr.write('x'*200000);sys.stderr.flush()
    response=dict(protocol_version=PERSISTENT_PROTOCOL,request_id=r['request_id'],
                  prediction=dict(request_id=r['request_id'],provider_id=r['provider_id'],latency_ms={}))
    if mode=='stale': response['request_id']='unknown'
    print(json.dumps(response),flush=True)
    if mode=='duplicate': print(json.dumps(response),flush=True)
'''


@pytest.fixture
def harness(tmp_path, monkeypatch):
    binary = tmp_path / 'env' / ('Scripts' if os.name == 'nt' else 'bin') / Path(sys.executable).name
    binary.parent.mkdir(parents=True)
    binary.write_bytes(b'fixture executable')
    (binary.parent.parent / 'pyvenv.cfg').write_text('fixture')
    config = WorkerConfig(workspace=tmp_path, python=str(binary.relative_to(tmp_path)), timeout_s=2)
    actual = subprocess.Popen
    children, modes = [], []
    def launch(args, **kwargs):
        assert args[-3] == '--persistent' and kwargs['shell'] is False
        mode = modes.pop(0) if modes else 'normal'
        child = actual([sys.executable, '-X', 'utf8', '-c', SCRIPT, mode, args[-2]], **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr(persistent_client.subprocess, 'Popen', launch)
    client = PersistentRecognitionWorkerClient(config)
    yield client, children, modes
    client.shutdown()
    assert all(child.poll() is not None for child in children)
    assert not any(t.is_alive() for t in client._threads)


def predict(client, request='request', provider=MODEL.provider_id, event=None):
    return client.invoke(request, 'kvsl:do_vat:W00395', event, provider_id=provider)


def test_lazy_handshake_sequential_and_switching(harness):
    client, children, _ = harness
    assert client.state == 'stopped' and not children
    for i, provider in enumerate([MODEL.provider_id, 'kvsl-gcn-cau-hoi', MODEL.provider_id]):
        result = predict(client, str(i), provider)
        assert result.prediction['request_id'] == str(i)
        assert result.prediction['provider_id'] == provider
        assert result.exit_status is None and client.state == 'ready'
    assert len(children) == 1
    process = children[0]
    client.shutdown()
    assert process.returncode == 0
    client.shutdown()


@pytest.mark.parametrize('field', ['protocol_version','request_id','status','worker_identity',
                                 'worker_version','providers','runtime_ready','pid'])
def test_invalid_handshake_recovery(harness, field):
    client, children, modes = harness
    modes.append('hello_' + field)
    with pytest.raises(RecognitionError, match='handshake|response'):
        predict(client)
    assert children[0].poll() is not None
    assert predict(client, 'next').prediction['request_id'] == 'next'


@pytest.mark.parametrize('mode,code', [('crash','worker_exit'),('malformed','worker_protocol'),
                                     ('oversized','worker_protocol'),('stale','worker_protocol'),
                                     ('block','worker_timeout'),('startup_timeout','worker_timeout'),
                                     ('cuda_memory','cuda_memory'),('host_memory','host_memory')])
def test_fault_reaped_and_next_request_recovers(harness, mode, code):
    client, children, modes = harness
    modes.append(mode)
    with pytest.raises(RecognitionError) as exc:
        predict(client)
    assert exc.value.code == code
    assert 'private' not in str(exc.value)
    assert children[0].poll() is not None
    assert predict(client, 'next').prediction['request_id'] == 'next'
    assert len(children) == 2


def test_duplicate_terminal_poisoned_stream(harness):
    client, children, modes = harness
    modes.append('duplicate')
    try:
        predict(client)
    except RecognitionError as exc:
        assert exc.code == 'worker_protocol'
    deadline = time.monotonic()+2
    while children[0].poll() is None and time.monotonic()<deadline:
        time.sleep(.01)
    assert children[0].poll() is not None
    assert predict(client, 'next').prediction['request_id'] == 'next'


@pytest.mark.parametrize('shutdown', [False,True])
def test_active_cancel_or_shutdown_stops_computation(harness, shutdown):
    client, children, modes = harness
    modes.append('block')
    event, failures = threading.Event(), []
    def run():
        try: predict(client,event=event)
        except RecognitionError as exc: failures.append(exc.code)
    thread=threading.Thread(target=run);thread.start()
    deadline=time.monotonic()+2
    while client.state!='busy' and time.monotonic()<deadline: time.sleep(.01)
    assert client.state=='busy'
    start=time.monotonic()
    if shutdown: client.shutdown()
    else: event.set()
    thread.join(4)
    assert not thread.is_alive() and failures==['cancelled']
    assert time.monotonic()-start<4 and children[0].poll() is not None
    if not shutdown: assert predict(client,'next').prediction['request_id']=='next'


def test_idle_crash_reaped_before_next_request(harness):
    client, children, _ = harness
    predict(client)
    if client._group: client._group.terminate()
    else: children[0].kill()
    children[0].wait(2)
    predict(client,'next')
    assert len(children)==2


def test_shutdown_unresponsive_worker_is_bounded(harness):
    client, children, modes = harness
    modes.append('shutdown_hang');predict(client)
    start=time.monotonic();client.shutdown()
    assert time.monotonic()-start<4 and children[0].poll() is not None


def test_stderr_is_bounded_and_not_protocol_failure(harness):
    client, _, modes = harness
    modes.append('stderr_flood')
    assert predict(client).prediction['request_id']=='request'
    assert sum(len(c) for c in client._stderr)<=65536


def test_blocked_input_pipe_does_not_defeat_timeout(harness):
    client, children, modes = harness
    modes.append('no_read')
    start=time.monotonic()
    with pytest.raises(RecognitionError) as exc:
        client.invoke('large','x'*60000,provider_id=MODEL.provider_id)
    assert exc.value.code=='worker_timeout'
    assert time.monotonic()-start<4 and children[0].poll() is not None
    assert predict(client,'next').prediction['request_id']=='next'


def test_parallel_callers_are_serialized(harness):
    client, children, _=harness
    results=[]
    threads=[threading.Thread(target=lambda i=i:results.append(predict(client,str(i)))) for i in range(4)]
    for thread in threads:thread.start()
    for thread in threads:thread.join(5)
    assert all(not thread.is_alive() for thread in threads)
    assert {r.prediction['request_id'] for r in results}=={'0','1','2','3'}
    assert len(children)==1


def test_provider_whitelist_before_spawn(harness):
    client, children, _=harness
    with pytest.raises(RecognitionError): predict(client,provider='../../model.pth')
    assert not children


def test_cache_only_inserts_verified_provider_and_refreshes_identity(monkeypatch):
    runtime=worker.WorkerRuntime.__new__(worker.WorkerRuntime)
    runtime.providers={};runtime.hits=runtime.misses=0
    calls=[]
    class Provider:
        def __init__(self,path,sources,video,request,model):
            calls.append(model.provider_id)
            if path==Path('invalid'): raise RecognitionError('model_hash','invalid artifact')
            self.descriptor=model
    monkeypatch.setattr(worker,'KVSLGCNProvider',Provider)
    from app.desktop_collector.recognition.registry import get_model
    other=get_model('kvsl-gcn-cau-hoi')
    with pytest.raises(RecognitionError): runtime.provider(Path('invalid'),{},'first','a',MODEL)
    assert not runtime.providers
    first,hit,_=runtime.provider(Path('valid'),{},'first','a',MODEL)
    assert not hit
    runtime.provider(Path('other'),{},'other','b',other)
    returned,hit,_=runtime.provider(Path('valid'),{},'second','c',MODEL)
    assert returned is first and hit and returned.video=='second' and returned.request_id=='c'
    assert runtime.hits==1 and runtime.misses==2
    with pytest.raises(RecognitionError): runtime.provider(Path('changed'),{},'x','d',MODEL)
    with pytest.raises(RecognitionError):
        runtime.provider(Path('valid'),{},'x','d',replace(MODEL,model_sha256='0'*64))


def test_clip_resets_between_recordings():
    runtime=worker.WorkerRuntime.__new__(worker.WorkerRuntime)
    class Holistic:
        resets=0
        def reset(self): self.resets+=1
    runtime.holistic=Holistic();runtime.used=False
    with runtime.clip(): pass
    assert runtime.holistic.resets==0
    with runtime.clip(): pass
    assert runtime.holistic.resets==1


def test_fresh_collector_isolation():
    script='''
import importlib.util,sys
from app.desktop_collector.recognition.service import RecognitionService
from app.desktop_collector.recognition.jobs import RecognitionJobService
for name in ('torch','mediapipe','torch_geometric'):
    assert name not in sys.modules
    assert importlib.util.find_spec(name) is None
with RecognitionService() as service:
    assert service.worker.process is None
'''
    result=subprocess.run([sys.executable,'-c',script],capture_output=True,timeout=10)
    assert result.returncode==0,result.stderr.decode(errors='replace')


@pytest.mark.parametrize('extra', ['checkpoint_path', 'video_path', 'config', 'workspace'])
def test_persistent_worker_rejects_request_paths(tmp_path, monkeypatch, extra):
    import io
    from types import SimpleNamespace
    from app.desktop_collector.recognition.contracts import PERSISTENT_PROTOCOL, encode
    runtime=SimpleNamespace(close=lambda:None)
    monkeypatch.setattr(worker,'WorkerRuntime',lambda:runtime)
    def forbidden(*args): pytest.fail('Path-bearing prediction reached inference')
    monkeypatch.setattr(worker,'handle',forbidden)
    request={'protocol_version':PERSISTENT_PROTOCOL,'operation':'predict_manifest_sample',
             'request_id':'test','provider_id':MODEL.provider_id,'sample_id':'kvsl:do_vat:W00395',extra:'injected'}
    monkeypatch.setattr(worker.sys,'stdin',SimpleNamespace(buffer=io.BytesIO(encode(request))))
    read_fd,write_fd=os.pipe()
    bootstrap={'workspace':str(tmp_path),'manifest':'manifest.json','upstream':'upstream','assets':'assets','checkpoint':'do_vat.pth'}
    try:
        assert worker.persistent_main(write_fd,'hello',encode(bootstrap).decode())==2
        assert b'"status":"ready"' in os.read(read_fd,10000)
    finally: os.close(read_fd)
