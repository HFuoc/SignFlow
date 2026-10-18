"""Single-use local process boundary. Executable/configuration are operator-owned."""
from dataclasses import dataclass
import math
import os
from pathlib import Path
import subprocess
import sys
import threading
import time

from .adapter import contained, verified_file
from .registry import get_model
from .experimental import VISIGN_MODEL, CHECKPOINT
from .videomae import VIDEOMAE_MODEL
from .gh_tcn import GH_TCN_MODEL
from .contracts import MODEL, PROTOCOL, RecognitionError, decode, encode, require

WORKER_MODULE = "app.desktop_collector.recognition.worker"


def worker_environment():
    """Bound native numeric pools before imports in each isolated inference worker."""
    environment = {k: v for k, v in os.environ.items() if k not in ("PYTHONPATH", "PYTHONHOME")}
    # Small single-frame inference does not benefit from inherited large BLAS pools.
    # Keep the host environment and MediaPipe graph's own executors unchanged.
    environment.update(OMP_NUM_THREADS="1", OPENBLAS_NUM_THREADS="1", MKL_NUM_THREADS="1")
    return environment


@dataclass(frozen=True, slots=True)
class WorkerConfig:
    workspace: Path = Path(__file__).resolve().parents[3]
    python: str = ".design-cache/kvsl-phase0a/extraction-env/Scripts/python.exe"
    manifest: str = ".design-cache/kvsl-phase0b/manifest.json"
    upstream: str = ".design-cache/kvsl-phase0a/upstream"
    assets: str = ".design-cache/kvsl-phase0a/assets"
    checkpoint: str = "do_vat.pth"
    worker_module: str = WORKER_MODULE
    timeout_s: float = 120.0
    capture_root: str | None = None

    def paths(self, model=None) -> dict:
        root = Path(self.workspace).resolve()
        require(self.worker_module == WORKER_MODULE, "worker_configuration", "Only the installed recognition worker is allowed")
        require(type(self.timeout_s) in (int, float) and math.isfinite(self.timeout_s) and 0 < self.timeout_s <= 600,
                "worker_configuration", "Timeout must be finite and within 0..600 seconds")
        paths = {key: contained(root, getattr(self, key)) for key in ("python", "manifest", "upstream", "assets")}
        checkpoint = self.checkpoint if model is None or model.provider_id == MODEL.provider_id else model.topic_id + ".pth"
        paths["checkpoint"] = contained(paths["assets"], checkpoint)
        if model == VISIGN_MODEL:
            paths["checkpoint"] = contained(root, CHECKPOINT)
            paths["assets"] = paths["checkpoint"].parent
        elif model in (VIDEOMAE_MODEL, GH_TCN_MODEL):
            paths['checkpoint'] = contained(root, model.checkpoint_path)
            paths['assets'] = paths['checkpoint'].parent
        return paths


@dataclass(frozen=True, slots=True)
class WorkerReply:
    prediction: dict
    exit_status: int | None
    diagnostics: str


def _run_cancellable(args, *, input, timeout, cancel_event, **kwargs):
    """Poll cancellation while communicate drains both pipes; always reap the child."""
    if cancel_event.is_set():
        raise RecognitionError("cancelled", "Recognition cancelled")
    deadline = time.monotonic() + timeout
    with subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, **kwargs) as process:
        first = True
        try:
            while True:
                if cancel_event.is_set():
                    raise RecognitionError("cancelled", "Recognition cancelled")
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise subprocess.TimeoutExpired(args, timeout)
                try:
                    stdout, stderr = process.communicate(input=input if first else None,
                                                         timeout=min(0.1, remaining))
                    return subprocess.CompletedProcess(args, process.returncode, stdout, stderr)
                except subprocess.TimeoutExpired:
                    first = False
        finally:
            if process.poll() is None:
                process.kill()
            process.communicate(timeout=3)


def invoke(config: WorkerConfig, request_id: str, sample_id: str,
           cancel_event: threading.Event | None = None, *, provider_id: str = MODEL.provider_id) -> WorkerReply:
    model = MODEL if provider_id == MODEL.provider_id else get_model(provider_id)
    paths = config.paths(model)
    executable = paths["python"]
    require(executable.is_file(), "missing_executable", "Configure an existing isolated ML Python executable")
    require(executable.name.lower() in ("python.exe", "python", "python3") and
            (executable.parent.parent / "pyvenv.cfg").is_file() and
            executable.parent.parent.resolve() != Path(sys.prefix).resolve(),
            "worker_configuration", "Worker must use a separate Python virtual environment")
    verified_file(paths["checkpoint"], model.model_sha256, "model_hash")
    request = {"protocol_version": PROTOCOL, "operation": "predict_manifest_sample",
               "request_id": request_id, "sample_id": sample_id, "provider_id": model.provider_id,
               "config": {k: str(v) for k, v in paths.items() if k != "python"},
               "workspace": str(Path(config.workspace).resolve())}
    try:
        runner = subprocess.run if cancel_event is None else _run_cancellable
        options = {"capture_output": True} if cancel_event is None else {"cancel_event": cancel_event}
        result = runner(
            [str(executable), "-X", "utf8", "-m", WORKER_MODULE],
            input=encode(request), timeout=config.timeout_s, **options,
            cwd=Path(__file__).resolve().parents[3], shell=False,
            env=worker_environment(),
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except subprocess.TimeoutExpired:
        # subprocess.run kills and waits for its child before raising. Worker spawns no children.
        raise RecognitionError("worker_timeout", "Isolated worker exceeded its timeout") from None
    except OSError:
        raise RecognitionError("worker_start", "Cannot start configured isolated Python") from None
    require(result.returncode == 0, "worker_exit", f"Isolated worker exited with status {result.returncode}")
    try:
        require(len(result.stdout) <= 131072, "worker_protocol", "Worker response exceeds limit")
        response = decode(result.stdout)
        require(set(response) == {"protocol_version", "request_id", "prediction"} and
                response["protocol_version"] == PROTOCOL and response["request_id"] == request_id and
                isinstance(response["prediction"], dict), "worker_protocol", "Invalid/cross-request worker response")
    except (ValueError, UnicodeError) as exc:
        if isinstance(exc, RecognitionError):
            raise
        raise RecognitionError("worker_protocol", "Malformed UTF-8/JSON worker response") from None
    return WorkerReply(response["prediction"], result.returncode, result.stderr.decode("utf-8", errors="replace"))
