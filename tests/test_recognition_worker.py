"""Real subprocess fault fixtures; no inference mocks are presented as ML evidence."""
from dataclasses import replace
import hashlib
import os
from pathlib import Path
import subprocess
import sys

import pytest

from app.desktop_collector.recognition import worker_client
from app.desktop_collector.recognition.contracts import MODEL, PROTOCOL, RecognitionError, encode
from app.desktop_collector.recognition.worker import handle, load_sources, validate_weights


@pytest.fixture
def config(tmp_path, monkeypatch):
    env = tmp_path / "env"
    binary = env / ("Scripts" if os.name == "nt" else "bin") / Path(sys.executable).name
    binary.parent.mkdir(parents=True)
    binary.write_bytes(b"test executable placeholder")
    (env / "pyvenv.cfg").write_text("test fixture")
    assets = tmp_path / "assets"
    assets.mkdir()
    (assets / "do_vat.pth").write_bytes(b"fixture")
    monkeypatch.setattr(worker_client, "MODEL", replace(MODEL, model_sha256=hashlib.sha256(b"fixture").hexdigest()))
    return worker_client.WorkerConfig(workspace=tmp_path, python=str(binary.relative_to(tmp_path)), assets="assets", timeout_s=2)


def use_process(monkeypatch, script):
    actual = subprocess.run
    def launch(args, **kwargs):
        assert isinstance(args, list) and kwargs["shell"] is False
        assert args[-1] == worker_client.WORKER_MODULE
        return actual([sys.executable, "-X", "utf8", "-c", script], **kwargs)
    monkeypatch.setattr(worker_client.subprocess, "run", launch)


@pytest.mark.parametrize("script,code", [
    ("print('not JSON')", "worker_protocol"),
    ("import sys; sys.stdout.buffer.write(b'\\xff')", "worker_protocol"),
    ("import sys; sys.exit(7)", "worker_exit"),
    ("import time; time.sleep(30)", "worker_timeout"),
    ("print('{}')", "worker_protocol"),
    ("print('{\"x\":1}\\n{\"x\":2}')", "worker_protocol"),
])
def test_process_failures(config, monkeypatch, script, code):
    use_process(monkeypatch, script)
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(config, "req", "kvsl:do_vat:W00395")
    assert error.value.code == code


def test_stderr_and_repeated_request_correlation(config, monkeypatch):
    script = '''
import json,sys
r=json.load(sys.stdin)
print('native harmless INFO',file=sys.stderr)
print(json.dumps({'protocol_version':r['protocol_version'],'request_id':r['request_id'],
                  'prediction':{'display_name':'cày','request_id':r['request_id']}},ensure_ascii=False))
'''
    use_process(monkeypatch, script)
    for request_id in ("first", "second", "third"):
        reply = worker_client.invoke(config, request_id, "kvsl:do_vat:W00395")
        assert reply.exit_status == 0
        assert reply.prediction == {"display_name": "cày", "request_id": request_id}
        assert "harmless" in reply.diagnostics


def test_stale_response(config, monkeypatch):
    data = encode({"protocol_version": PROTOCOL, "request_id": "stale", "prediction": {}})
    use_process(monkeypatch, f"import sys;sys.stdout.buffer.write({data!r})")
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(config, "req", "sample")
    assert error.value.code == "worker_protocol"


def test_worker_bounds_native_pools_without_changing_host(config, monkeypatch):
    for name in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        monkeypatch.setenv(name, "16")
    monkeypatch.setenv("PYTHONPATH", "untrusted-path")
    monkeypatch.setenv("PYTHONHOME", "untrusted-home")
    use_process(monkeypatch, '''
import json, os, sys
r=json.load(sys.stdin)
assert 'PYTHONPATH' not in os.environ and 'PYTHONHOME' not in os.environ
assert all(os.environ[n]=='1' for n in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'))
print(json.dumps({'protocol_version':r['protocol_version'],'request_id':r['request_id'],'prediction':{}}))
''')
    assert worker_client.invoke(config, "threads", "sample").exit_status == 0
    assert os.environ["OMP_NUM_THREADS"] == "16"
    assert os.environ["PYTHONPATH"] == "untrusted-path"


@pytest.mark.parametrize("missing", [True, False])
def test_checkpoint_integrity(config, missing):
    checkpoint = config.paths()["checkpoint"]
    if missing:
        checkpoint.unlink()
    else:
        checkpoint.write_bytes(b"wrong weights")
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(config, "req", "sample")
    assert error.value.code == ("missing_model" if missing else "model_hash")


def test_missing_executable(config):
    config.paths()["python"].unlink()
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(config, "req", "sample")
    assert error.value.code == "missing_executable"


def test_executable_cannot_be_shell(config):
    shell = config.workspace / "cmd.exe"
    shell.write_bytes(b"fixture")
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(replace(config, python="cmd.exe"), "req", "sample")
    assert error.value.code == "worker_configuration"


def test_invalid_worker_operation():
    with pytest.raises(RecognitionError):
        handle({"operation": "execute_code"})


def test_source_integrity(tmp_path):
    with pytest.raises(RecognitionError) as error:
        load_sources(tmp_path)
    assert error.value.code == "missing_source"
    (tmp_path / "data").mkdir()
    (tmp_path / "data/constants.py").write_text("modified")
    with pytest.raises(RecognitionError) as error:
        load_sources(tmp_path)
    assert error.value.code == "source_hash"


def test_weight_shapes():
    class TensorShape:
        def __init__(self, shape): self.shape = shape
    with pytest.raises(RecognitionError) as error:
        validate_weights({"fc.weight": TensorShape((10, 256))})
    assert error.value.code == "output_class_count"
    with pytest.raises(RecognitionError) as error:
        validate_weights({"fc.weight": TensorShape((20, 256)), "conv1.lin.weight": TensorShape((256, 120))})
    assert error.value.code == "feature_mismatch"


def test_timeout_reaps_child(config, monkeypatch):
    children = []
    real_popen = subprocess.Popen
    def capture_child(*args, **kwargs):
        child = real_popen(*args, **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr(subprocess, "Popen", capture_child)
    use_process(monkeypatch, "import time; time.sleep(30)")
    with pytest.raises(RecognitionError) as error:
        worker_client.invoke(config, "req", "sample")
    assert error.value.code == "worker_timeout"
    assert len(children) == 1 and children[0].poll() is not None


@pytest.mark.parametrize("cancel", [False, True])
def test_cancellable_process_is_reaped(config, monkeypatch, tmp_path, cancel):
    import threading
    import time
    actual = subprocess.Popen
    children = []
    ready = tmp_path / "ready"
    script = "import pathlib,time;pathlib.Path(" + repr(str(ready)) + ").write_text('ready');time.sleep(30)"
    def launch(args, **kwargs):
        child = actual([sys.executable, "-X", "utf8", "-c", script], **kwargs)
        children.append(child)
        return child
    monkeypatch.setattr(worker_client.subprocess, "Popen", launch)
    event = threading.Event()
    failures = []
    def invoke():
        try:
            worker_client.invoke(config, "request", "sample", event)
        except RecognitionError as exc:
            failures.append(exc.code)
    thread = threading.Thread(target=invoke)
    thread.start()
    deadline = time.monotonic() + 2
    while not ready.exists() and time.monotonic() < deadline:
        time.sleep(.01)
    assert ready.exists()
    if cancel:
        event.set()
    thread.join(5)
    assert not thread.is_alive()
    assert failures == ["cancelled" if cancel else "worker_timeout"]
    assert len(children) == 1 and children[0].poll() is not None
