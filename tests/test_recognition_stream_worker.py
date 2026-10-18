"""Real binary pipes and child teardown; synthetic replies are not model evidence."""
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

import pytest

from app.desktop_collector.recognition import persistent_client, streaming
from app.desktop_collector.recognition.contracts import RecognitionError
from app.desktop_collector.recognition.streaming import StreamWorkerClient
from app.desktop_collector.recognition.worker_client import WorkerConfig
from test_recognition_stream import png

SCRIPT = r'''
import json,os,sys,time
from app.desktop_collector.recognition.contracts import encode
from app.desktop_collector.recognition.streaming import STREAM_PROTOCOL,stream_prediction
mode,hello_id,configuration=sys.argv[1:]
stream_id=json.loads(configuration)['stream_id']
hello=dict(protocol_version=STREAM_PROTOCOL,request_id=hello_id,status='ready',stream_id=stream_id,pid=os.getpid())
if mode.startswith('hello_'): hello[mode[6:]]='invalid'
if mode=='startup_block': time.sleep(30)
if mode=='cuda_memory':
    print('SMARTGLOVE_WORKER_ERROR: cuda_memory /private/model/path',file=sys.stderr,flush=True)
    sys.exit(2)
sys.stdout.buffer.write(encode(hello));sys.stdout.buffer.flush()
if mode=='no_read': time.sleep(30)
while raw:=sys.stdin.buffer.readline():
    request=json.loads(raw)
    if request['operation']=='shutdown': break
    image=sys.stdin.buffer.read(request['bytes'])
    if len(image)!=request['bytes'] or image[-4:]!=b'TAIL': os._exit(8)
    if mode=='frame_block': time.sleep(30)
    if mode=='crash': os._exit(7)
    if mode=='host_memory':
        print('OSError: [WinError 1455] private checkpoint path',file=sys.stderr,flush=True)
        sys.exit(2)
    if mode=='malformed': print('not JSON',flush=True);continue
    header=request['header']
    frame=dict(**header,state='ready',phase=None,segment_id=0,prediction=None,quality={})
    if mode.startswith('frame_'):
        field=mode[6:]
        if field in frame: frame[field]='invalid'
    if mode=='prediction':
        frame['phase']='provisional'
        frame['prediction']=stream_prediction('wrong-stream',1,header['sequence']).to_dict()
    response=dict(protocol_version=STREAM_PROTOCOL,request_id=request['request_id'],frame=frame)
    if mode=='stale': response['request_id']='another-stream'
    sys.stdout.buffer.write(encode(response));sys.stdout.buffer.flush()
'''


@pytest.fixture
def process_harness(tmp_path, monkeypatch):
    binary = tmp_path / "env" / ("Scripts" if os.name == "nt" else "bin") / Path(sys.executable).name
    binary.parent.mkdir(parents=True)
    binary.write_bytes(b"fixture executable")
    (binary.parent.parent / "pyvenv.cfg").write_text("fixture")
    config = WorkerConfig(workspace=tmp_path, python=str(binary.relative_to(tmp_path)))
    actual = subprocess.Popen
    children, modes = [], []
    def launch(args, **kwargs):
        assert args[-3] == "--stream" and kwargs["shell"] is False
        child = actual([sys.executable, "-X", "utf8", "-c", SCRIPT,
                        modes.pop(0) if modes else "normal", args[-2], args[-1]], **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr(persistent_client.subprocess, "Popen", launch)
    monkeypatch.setattr(streaming, "OPERATION_TIMEOUT_S", 1.5)
    client = StreamWorkerClient(config, "test-stream")
    yield client, children, modes
    client.shutdown()
    assert all(child.poll() is not None for child in children)
    assert not any(thread.is_alive() for thread in client._threads)


def send(client, sequence=0, event=None, image=None):
    return client.exchange({"type": "frame", "sequence": sequence, "timestamp_ms": sequence * 100},
                           png() + b"TAIL" if image is None else image, event)


def test_binary_framing_large_frame_and_sequential_acknowledgements(process_harness):
    client, children, _ = process_harness
    assert client.process is None
    assert client.exchange() is None
    large = png() + b"\xff" * (streaming.MAX_FRAME_BYTES - len(png()) - 4) + b"TAIL"
    assert send(client, image=large)["sequence"] == 0
    assert send(client, 1)["sequence"] == 1
    assert len(children) == 1
    client.shutdown()
    assert children[0].returncode == 0
    client.shutdown()


@pytest.mark.parametrize('mode', ['cuda_memory', 'host_memory'])
def test_runtime_memory_failure_is_safe_reaped_and_recoverable(process_harness, mode):
    client, children, modes = process_harness
    modes.append(mode)
    with pytest.raises(RecognitionError) as error:
        send(client)
    assert error.value.code == mode
    assert 'private' not in str(error.value)
    assert children[0].poll() is not None and client.process is None
    assert send(client)['sequence'] == 0


@pytest.mark.parametrize("mode", ["hello_stream_id", "hello_pid", "hello_protocol_version", "hello_status",
                                  "frame_sequence", "frame_timestamp_ms", "frame_state", "frame_phase",
                                  "frame_segment_id", "frame_quality", "prediction", "stale", "malformed"])
def test_invalid_worker_replies_fail_closed_and_reap(process_harness, mode):
    client, children, modes = process_harness
    modes.append(mode)
    with pytest.raises(RecognitionError) as error:
        send(client)
    assert error.value.code == "worker_protocol"
    assert children[0].poll() is not None and client.process is None


@pytest.mark.parametrize("mode", ["startup_block", "frame_block", "no_read"])
def test_operation_deadline_includes_startup_and_blocked_binary_pipe(process_harness, mode):
    client, children, modes = process_harness
    modes.append(mode)
    started = time.monotonic()
    with pytest.raises(RecognitionError) as error:
        send(client, image=png() + b"\0" * 1_000_000 + b"TAIL")
    assert error.value.code == "worker_timeout"
    assert time.monotonic() - started < 4
    assert children[0].poll() is not None


@pytest.mark.parametrize("mode", ["startup_block", "frame_block"])
@pytest.mark.parametrize("shutdown", [False, True])
def test_cancel_or_shutdown_reaps_pending_real_child(process_harness, mode, shutdown):
    client, children, modes = process_harness
    modes.append(mode)
    event, failures = threading.Event(), []
    def invoke():
        try:
            send(client, event=event)
        except RecognitionError as error:
            failures.append(error.code)
    caller = threading.Thread(target=invoke)
    caller.start()
    deadline = time.monotonic() + 1
    while time.monotonic() < deadline:
        if children and (mode == "startup_block" or client.worker_pid is not None):
            break
        time.sleep(.005)
    assert children
    if shutdown:
        client.shutdown()
    else:
        event.set()
    caller.join(4)
    assert not caller.is_alive() and failures == ["cancelled"]
    assert children[0].poll() is not None and client.process is None
