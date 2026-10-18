"""Bounded session-local recognition jobs. No ML imports or durable job storage."""
from collections import OrderedDict
from copy import deepcopy
from datetime import datetime, timezone
import logging
import threading
import uuid

from .adapter import KVSLVideoAdapter, contained, verified_file
from .contracts import MODEL, RecognitionError, decode, require
from .registry import get_model
from .experimental import VISIGN_MODEL
from .videomae import VIDEOMAE_MODEL, artifacts, verify_checkpoint
from .gh_tcn import GH_TCN_MODEL, NORMALIZATION_SHA256
from .service import RecognitionService
from .runtime_errors import MESSAGES as RUNTIME_MESSAGES

LOG = logging.getLogger(__name__)
TERMINAL = {"succeeded", "failed", "cancelled"}


def now():
    return datetime.now(timezone.utc).isoformat()


class RecognitionCatalog:
    def __init__(self, service):
        self.service = service

    def models(self):
        models = []
        for model in self.service.describe():
            reason = None
            try:
                paths = self.service.config.paths(model)
                require(paths["python"].is_file() and
                        (paths["python"].parent.parent / "pyvenv.cfg").is_file(),
                        "missing_executable", "Isolated ML environment is unavailable")
                if model == VIDEOMAE_MODEL:
                    verify_checkpoint(paths['checkpoint'])
                else:
                    verified_file(paths["checkpoint"], model.model_sha256, "model_hash")
                if model == VIDEOMAE_MODEL:
                    artifacts(self.service.config.workspace)
                elif model == GH_TCN_MODEL:
                    verified_file(contained(paths["assets"], "normalization.npz"), NORMALIZATION_SHA256, "model_hash")
                elif model != VISIGN_MODEL:
                    verified_file(contained(paths["assets"], model.topic_id + ".json"), model.label_map_sha256)
                    require(paths["manifest"].is_file() and paths["upstream"].is_dir(),
                            "missing_source", "Manifest or pinned source is unavailable")
                    for name in ("data/constants.py", "data/checkpoint_extraction.py",
                                 "app/backend/src/models/gcn_model.py", "app/backend/src/services/prediction_gcn.py"):
                        require(contained(paths["upstream"], name).is_file(), "missing_source", "Pinned source is unavailable")
            except (RecognitionError, OSError, ValueError):
                reason = "Required local recognition artifacts or isolated environment are unavailable."
            models.append({"provider_id": model.provider_id, "display_name": model.display_name,
                           "topic_id": model.topic_id, "class_count": model.class_count,
                           "modality": model.modality, "preprocessing_id": model.preprocessing_id,
                           "family": model.family, "experimental": model.experimental,
                           "requires_topic": model.requires_topic, "supported_words": list(model.supported_words),
                           "score_kind": model.score_kind,
                           "availability": "available" if reason is None else "unavailable", "reason": reason})
        return models

    def samples(self, provider_id=None):
        models = ({get_model(provider_id).topic_id: get_model(provider_id)} if provider_id is not None else
                  {model.topic_id: model for model in self.service.describe()})
        available = {m["provider_id"]: m["availability"] == "available" for m in self.models()}
        try:
            paths = self.service.config.paths()
            manifest = decode(paths["manifest"].read_bytes())
            samples = []
            for recording in manifest["recordings"]:
                for annotation in recording["annotations"]:
                    model = models.get(annotation["topic_id"])
                    if model is None:
                        continue
                    sample_id = f"kvsl:{model.topic_id}:" + recording["recording_id"].removeprefix("kvsl:")
                    reason = None
                    try:
                        KVSLVideoAdapter(paths["manifest"], paths["assets"], model).resolve(sample_id)
                    except RecognitionError:
                        reason = "Local video or manifest identity is unavailable or invalid."
                    valid = reason is None
                    if valid and not available[model.provider_id]:
                        reason = "Recognition provider is unavailable."
                    samples.append({"sample_id": sample_id, "recording_id": recording["recording_id"],
                                    "filename": recording["video_filename"], "topic_id": model.topic_id,
                                    "label_id": annotation["label_id"], "display_label": annotation["label"],
                                    "asset_status": "valid" if valid else "unavailable",
                                    "provider_id": model.provider_id, "supported": reason is None, "reason": reason})
            return samples
        except (OSError, ValueError, KeyError, TypeError):
            raise RecognitionError("invalid_manifest", "Local dataset manifest is unavailable or invalid") from None

    def validate(self, sample_id, provider_id):
        model = get_model(provider_id)
        require(model.requires_topic, "unsupported_input", "This research model accepts camera captures only")
        paths = self.service.config.paths(model)
        KVSLVideoAdapter(paths["manifest"], paths["assets"], model).resolve(sample_id)
        available = next(m for m in self.models() if m["provider_id"] == provider_id)
        require(available["availability"] == "available", "provider_unavailable", "Recognition provider is unavailable")


class RecognitionJobService:
    def __init__(self, service=None, *, max_pending=8, max_history=32):
        self.service = service or RecognitionService()
        self.catalog = RecognitionCatalog(self.service)
        self.max_pending, self.max_history = max_pending, max_history
        self._condition = threading.Condition()
        self._jobs = OrderedDict()
        self._closed = False
        self._thread = None

    def start(self):
        with self._condition:
            if self._thread is None and not self._closed:
                self._thread = threading.Thread(target=self._run, name="recognition-jobs", daemon=True)
                self._thread.start()

    @staticmethod
    def _public(entry):
        return deepcopy(entry["job"])

    def cleanup(self):
        # Called under the condition lock; never evict active jobs.
        completed = [key for key, entry in self._jobs.items() if entry["job"]["status"] in TERMINAL]
        for key in completed[:-self.max_history] if self.max_history else completed:
            del self._jobs[key]

    def submit(self, owner, sample_id, provider_id):
        self.catalog.validate(sample_id, provider_id)
        return self._submit(owner, sample_id, provider_id)

    def live_provider(self, topic_id):
        matches = [m for m in self.catalog.models() if m["topic_id"] == topic_id]
        require(len(matches) == 1, "unsupported_topic", "Choose a verified topic")
        require(matches[0]["availability"] == "available", "provider_unavailable", "Provider unavailable")
        return matches[0]["provider_id"]

    def submit_capture(self, owner, data, provider_id):
        get_model(provider_id)
        capture_id = self.service.captures.create(data)
        try:
            return self._submit(owner, None, provider_id, capture_id)
        except BaseException:
            self.service.captures.delete(capture_id)
            raise

    def _submit(self, owner, sample_id, provider_id, capture_id=None):
        with self._condition:
            require(not self._closed, "service_stopped", "Recognition is shutting down")
            active = [e for e in self._jobs.values() if e["job"]["status"] not in TERMINAL]
            require(not any(e["owner"] == owner and e["job"]["sample_id"] == sample_id for e in active),
                    "job_active", "This sample already has an active job")
            require(len(active) < self.max_pending, "queue_full", "Recognition queue is full")
            job = {"schema_version": "smartglove-recognition-job-v1", "job_id": uuid.uuid4().hex,
                   "source_kind": "live_camera_capture" if capture_id else "manifest_sample", "capture_id": capture_id,
                   "sample_id": sample_id, "provider_id": provider_id, "status": "queued",
                   "created_at": now(), "started_at": None, "finished_at": None,
                   "prediction": None, "error": None, "cancel_requested": False}
            self._jobs[job["job_id"]] = {"owner": owner, "job": job, "cancel": threading.Event()}
            self.cleanup()
            self._condition.notify_all()
            LOG.info("Recognition job %s submitted", job["job_id"])
            return deepcopy(job)

    def _entry(self, owner, job_id):
        entry = self._jobs.get(job_id)
        require(entry is not None and entry["owner"] == owner, "unknown_job", "Recognition job not found")
        return entry

    def get(self, owner, job_id):
        with self._condition:
            return self._public(self._entry(owner, job_id))

    def list(self, owner):
        with self._condition:
            return [self._public(e) for e in self._jobs.values() if e["owner"] == owner]

    def _finish(self, entry, status, *, prediction=None, error=None):
        job = entry["job"]
        if job["status"] in TERMINAL:
            return
        if job.get("capture_id"):
            try:
                self.service.captures.delete(job["capture_id"])
            except (OSError, RecognitionError):
                status, prediction = "failed", None
                error = {"code": "capture_cleanup", "message": "Temporary capture cleanup failed. Close the application to retry cleanup."}
        job.update(status=status, finished_at=now(), prediction=prediction, error=error)
        LOG.info("Recognition job %s %s%s", job["job_id"], status,
                 " (" + error["code"] + ")" if error else "")
        self.cleanup()
        self._condition.notify_all()

    def cancel(self, owner, job_id):
        with self._condition:
            entry = self._entry(owner, job_id)
            if entry["job"]["status"] not in TERMINAL:
                entry["cancel"].set()
                entry["job"]["cancel_requested"] = True
                if entry["job"]["status"] == "queued":
                    self._finish(entry, "cancelled")
            return self._public(entry)

    def _run(self):
        while True:
            with self._condition:
                self._condition.wait_for(lambda: self._closed or any(e["job"]["status"] == "queued" for e in self._jobs.values()))
                if self._closed:
                    return
                entry = next(e for e in self._jobs.values() if e["job"]["status"] == "queued")
                job = entry["job"]
                job.update(status="running", started_at=now())
                LOG.info("Recognition job %s started", job["job_id"])
            try:
                options = {"capture_id": job["capture_id"]} if job.get("capture_id") else {}
                result = self.service.recognize(job["sample_id"], job["provider_id"], cancel_event=entry["cancel"], **options)
                execution_stopped = True
                prediction = result.to_dict()
                error = None if result.status == "ok" else {
                    "code": result.error_code or "recognition_failed",
                    "message": {
                        **RUNTIME_MESSAGES,
                        "video_decode": "The recorded clip could not be decoded. Capture again.",
                        "empty_video": "No video frames were decoded. Capture again.",
                        "capture_short": "Too few camera frames were recorded. Capture again.",
                        "capture_media": "The camera media format or resolution is unsupported. Try another camera.",
                        "capture_duration": "The recorded clip exceeded the six-second limit. Capture again.",
                        "hands_missing": "Keep both hands and your upper body visible, then try again.",
                        "worker_timeout": "Recognition timed out. You can capture again.",
                        "uncertain_sign": "Not confident enough to name this sign. Try one complete sign again.",
                        "outside_vocabulary": "Sign outside the supported vocabulary. Try one of the 25 listed signs.",
                        "cuda_unavailable": "VideoMAE needs the NVIDIA GPU. Close heavy apps and retry, or select V25.",
                        "recognition_busy": "Stop Auto or wait for the current prediction to finish, then try again.",
                    }.get(result.error_code, "Recognition could not complete. Check local artifacts and try again.")}
            except Exception:
                execution_stopped = False
                LOG.exception("Recognition job %s failed", job["job_id"])
                prediction, error = None, {"code": "backend_error", "message": "Recognition could not complete."}
            with self._condition:
                if entry["cancel"].is_set() and execution_stopped:
                    self._finish(entry, "cancelled")
                elif error:
                    self._finish(entry, "failed", error=error)
                else:
                    self._finish(entry, "succeeded", prediction=prediction)

    def shutdown(self, timeout=5.0):
        with self._condition:
            self._closed = True
            for entry in tuple(self._jobs.values()):
                if entry["job"]["status"] not in TERMINAL:
                    entry["cancel"].set()
                    entry["job"]["cancel_requested"] = True
                    if entry["job"]["status"] == "queued":
                        self._finish(entry, "cancelled")
            self._condition.notify_all()
        # Close the execution boundary as well as the queue; an idle persistent
        # worker must not survive application shutdown.
        shutdown = getattr(self.service, "shutdown", None)
        if shutdown:
            shutdown()
        if self._thread and self._thread is not threading.current_thread():
            self._thread.join(timeout)
            if self._thread.is_alive():
                raise RuntimeError("Recognition executor did not stop within shutdown bound")
