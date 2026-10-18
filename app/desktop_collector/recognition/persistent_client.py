"""Serial, lazy JSONL process client. This module never imports ML packages."""
from collections import deque
import logging
import queue
from pathlib import Path
import subprocess
import sys
import threading
import time
import uuid

from .contracts import (PERSISTENT_PROTOCOL, WORKER_IDENTITY, WORKER_VERSION,
                        RecognitionError, decode, encode, require)
from .registry import get_model, runtime_providers
from .worker_client import WORKER_MODULE, WorkerReply, worker_environment
from .process_group import new_process_group
from .runtime_errors import runtime_failure

LOG = logging.getLogger(__name__)


class PersistentRecognitionWorkerClient:
    protocol = PERSISTENT_PROTOCOL
    def __init__(self, config, *, cuda=False):
        self.config = config
        self.cuda = cuda
        self.state = "stopped"
        self.process = None
        self._serial = threading.Lock()
        self._condition = threading.Condition()
        self._closed = threading.Event()
        self._threads = []
        self._expected = None
        self._response = None
        self._fault = None
        self._stderr = deque(maxlen=32)  # At most 32 * 2048 bytes.
        self._spawns = 0
        self._shutting_down = False
        self._group = None
        self.worker_pid = None
        self._writes = None
        self._writer_stop = threading.Event()

    def _write_stdin(self, process):
        try:
            while not self._writer_stop.is_set():
                try:
                    payload = self._writes.get(timeout=.05)
                except queue.Empty:
                    continue
                # Unbuffered pipe writes may be partial; keep framing intact.
                while payload:
                    written = process.stdin.write(payload)
                    if not written:
                        raise OSError("Worker input pipe closed")
                    payload = payload[written:]
        except OSError:
            with self._condition:
                self._fault = RecognitionError("worker_exit", "Isolated worker closed its input")
                self._condition.notify_all()

    def _read_stdout(self, process):
        try:
            while True:
                raw = process.stdout.readline(131073)
                if not raw:
                    if self._shutting_down:
                        return
                    raise RecognitionError("worker_exit", "Isolated worker closed its output")
                require(len(raw) <= 131072 and raw.endswith(b"\n"),
                        "worker_protocol", "Invalid worker frame length")
                response = decode(raw)
                with self._condition:
                    require(self._expected is not None and self._response is None and
                            response.get("request_id") == self._expected and
                            response.get("protocol_version") == self.protocol,
                            "worker_protocol", "Unexpected or duplicate worker response")
                    self._expected = None
                    self._response = response
                    self._condition.notify_all()
        except (ValueError, OSError) as exc:
            with self._condition:
                self._fault = exc if isinstance(exc, RecognitionError) else RecognitionError(
                    "worker_protocol", "Malformed worker output")
                self.state = "failed"
                self._condition.notify_all()
            if process.poll() is None:
                if self._group:
                    self._group.terminate()
                else:
                    process.kill()

    def _read_stderr(self, process):
        try:
            while chunk := process.stderr.read(2048):
                with self._condition:
                    self._stderr.append(chunk)
        except OSError:
            pass

    def _wait(self, deadline, cancel_event=None):
        with self._condition:
            while True:
                if self._closed.is_set() or (cancel_event and cancel_event.is_set()):
                    raise RecognitionError("cancelled", "Recognition cancelled")
                if self._fault:
                    raise self._fault
                if self._response is not None:
                    response, self._response = self._response, None
                    return response
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise RecognitionError("worker_timeout", "Isolated worker exceeded its timeout")
                self._condition.wait(min(.05, remaining))

    def _send(self, message):
        payload = encode(message)
        require(len(payload) <= 65536, "worker_protocol", "Worker request exceeds limit")
        self._enqueue(payload, message["request_id"])

    def _enqueue(self, payload, request_id):
        """One bounded writer, shared by JSON jobs and length-framed camera input."""
        with self._condition:
            if self._fault:
                raise self._fault
            require(self._expected is None and self._response is None,
                    "worker_protocol", "Unexpected pending worker response")
            self._expected = request_id
        try:
            self._writes.put_nowait(payload)
        except queue.Full:
            raise RecognitionError("worker_protocol", "Worker input is unexpectedly pending") from None

    def _reap(self):
        process = self.process
        self._writer_stop.set()
        if process is not None:
            if self._group:
                self._group.terminate()
            if process.poll() is None:
                process.kill()
            process.wait(timeout=2)
            for thread in self._threads:
                thread.join(1)
            if any(thread.is_alive() for thread in self._threads):
                raise RuntimeError("Recognition pipe thread did not stop after process termination")
            for pipe in (process.stdin, process.stdout, process.stderr):
                pipe.close()
            self.process = None
        if self._group:
            self._group.close()
            self._group = None
        self.worker_pid = None
        self._threads = []
        self.state = "stopped"

    def invalidate(self):
        """Discard a stream whose prediction failed semantic validation."""
        with self._serial:
            self._reap()
            self.state = "failed"

    def _classified_failure(self, error):
        # Called after reaping: the bounded stderr reader has finished draining.
        if isinstance(error, RecognitionError) and error.code == 'worker_exit':
            with self._condition:
                diagnostic = b''.join(self._stderr).decode('utf-8', errors='replace')
            return runtime_failure(diagnostics=diagnostic) or error
        return error

    def _start(self, deadline, cancel_event):
        paths = self.config.paths()
        executable = paths["python"]
        require(executable.is_file(), "missing_executable", "Configure an existing isolated ML Python executable")
        require(executable.name.lower() in ("python.exe", "python", "python3") and
                (executable.parent.parent / "pyvenv.cfg").is_file() and
                executable.parent.parent.resolve() != Path(sys.prefix).resolve(),
                "worker_configuration", "Worker must use a separate Python virtual environment")
        self.state = "starting"
        self._shutting_down = False
        self._writer_stop.clear()
        self._writes = queue.Queue(maxsize=1)
        with self._condition:
            self._fault = self._response = self._expected = None
            self._stderr.clear()
        hello_id = str(uuid.uuid4())
        self._expected = hello_id
        LOG.info("%s", "worker_restart" if self._spawns else "worker_spawn")
        self._group = new_process_group()
        self.process = subprocess.Popen(
            self._command(executable, hello_id),
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            cwd=Path(__file__).resolve().parents[3], shell=False, bufsize=0,
            env=worker_environment(),
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0) | (4 if self._group else 0))
        if self._group:
            self._group.attach_and_resume(self.process)
        self._spawns += 1
        for target in (self._read_stdout, self._read_stderr, self._write_stdin):
            thread = threading.Thread(target=target, args=(self.process,), daemon=True,
                                      name="recognition-pipe")
            self._threads.append(thread)
            thread.start()
        hello = self._wait(deadline, cancel_event)
        self._validate_hello(hello)
        self.worker_pid = hello["pid"]
        self.state = "ready"
        LOG.info("worker_ready")

    def _command(self, executable, hello_id):
        return [str(executable), "-X", "utf8", "-m", WORKER_MODULE,
                "--videomae" if self.cuda else "--persistent", hello_id,
                encode({"workspace": str(Path(self.config.workspace).resolve()),
                        **{key: getattr(self.config, key) for key in
                           ("manifest", "upstream", "assets", "checkpoint", "capture_root")}}).decode("utf-8")]

    def _validate_hello(self, hello):
        require(set(hello) == {"protocol_version", "request_id", "status", "worker_identity",
                             "worker_version", "providers", "runtime_ready", "pid"} and
                hello["status"] == "ready" and hello["worker_identity"] == WORKER_IDENTITY and
                hello["worker_version"] == WORKER_VERSION and hello["runtime_ready"] is True and
                hello["providers"] == runtime_providers(cuda=self.cuda) and type(hello["pid"]) is int and
                (self._group.contains(hello["pid"]) if self._group else hello["pid"] == self.process.pid),
                "worker_protocol", "Invalid isolated worker handshake")

    def invoke(self, request_id, sample_id, cancel_event=None, *, provider_id, capture_id=None):
        model = get_model(provider_id)
        self.config.paths(model)
        deadline = time.monotonic() + self.config.timeout_s
        # The job service is serial; offline concurrent callers also cannot interleave IPC.
        while not self._serial.acquire(timeout=.05):
            if self._closed.is_set() or (cancel_event and cancel_event.is_set()):
                raise RecognitionError("cancelled", "Recognition cancelled")
            require(time.monotonic() < deadline, "worker_timeout", "Recognition queue wait exceeded timeout")
        try:
            require(not self._closed.is_set(), "service_stopped", "Recognition is shutting down")
            if cancel_event and cancel_event.is_set():
                raise RecognitionError("cancelled", "Recognition cancelled")
            # A dead idle process is reclaimable; never retry an already submitted request.
            if self.process is not None and self.process.poll() is not None:
                self._reap()
            cold_start = 0.0
            if self.process is None:
                start = time.perf_counter()
                self._start(deadline, cancel_event)
                cold_start = (time.perf_counter() - start) * 1000
            self.state = "busy"
            LOG.info("prediction_start request_id=%s provider_id=%s", request_id, provider_id)
            source = {"capture_id": capture_id} if capture_id else {"sample_id": sample_id}
            self._send({"protocol_version": PERSISTENT_PROTOCOL,
                        "operation": "predict_live_capture" if capture_id else "predict_manifest_sample",
                        "request_id": request_id, **source, "provider_id": provider_id})
            response = self._wait(deadline, cancel_event)
            require(set(response) == {"protocol_version", "request_id", "prediction"} and
                    isinstance(response["prediction"], dict), "worker_protocol", "Invalid prediction response")
            prediction = response["prediction"]
            require(isinstance(prediction.get("latency_ms"), dict), "worker_protocol", "Missing worker timing")
            prediction["latency_ms"]["cold_start"] = cold_start
            self.state = "ready"
            LOG.info("prediction_complete request_id=%s", request_id)
            with self._condition:
                diagnostics = b"".join(self._stderr).decode("utf-8", errors="replace")
            return WorkerReply(prediction, None, diagnostics)
        except (RecognitionError, OSError, ValueError) as exc:
            code = exc.code if isinstance(exc, RecognitionError) else "worker_start"
            LOG.info("%s request_id=%s", {"cancelled": "prediction_cancel", "worker_timeout": "worker_timeout",
                                        "worker_exit": "worker_crash"}.get(code, code), request_id)
            self._reap()
            self.state = "failed"
            exc = self._classified_failure(exc)
            if isinstance(exc, RecognitionError):
                raise exc
            raise RecognitionError(code, "Isolated worker communication failed") from None
        finally:
            self._serial.release()

    def shutdown(self):
        self._closed.set()
        with self._condition:
            self._condition.notify_all()
        if not self._serial.acquire(timeout=4):
            raise RuntimeError("Recognition client did not stop within shutdown bound")
        try:
            if self.process is not None and self.process.poll() is None and not self._fault:
                try:
                    self._shutting_down = True
                    self._send({"protocol_version": self.protocol, "operation": "shutdown",
                                "request_id": str(uuid.uuid4())})
                    self.process.wait(timeout=1)
                except (OSError, RecognitionError, subprocess.TimeoutExpired):
                    pass
            self._reap()
            LOG.info("worker_shutdown")
        finally:
            self._serial.release()
