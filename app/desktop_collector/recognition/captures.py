"""Transient camera inputs. Only server-generated IDs cross the worker boundary."""
from dataclasses import dataclass
import hashlib
from pathlib import Path
import re
import tempfile
import threading
import uuid

from .adapter import ResolvedVideo, contained, verified_file
from .contracts import decode, require
from .experimental import VISIGN_MODEL, classes as visign_classes
from .videomae import VIDEOMAE_MODEL
from .gh_tcn import GH_TCN_MODEL, classes as gh_classes

MAX_CAPTURE_BYTES = 8 * 1024 * 1024
MAX_CAPTURE_SECONDS = 6.0


@dataclass(frozen=True, slots=True)
class LiveCaptureRef:
    capture_id: str
    topic_id: str
    sample_id: None = None
    recording_id: None = None


def capture_path(root, capture_id):
    require(isinstance(capture_id, str) and re.fullmatch(r"[a-f0-9]{32}", capture_id),
            "invalid_capture", "Invalid capture identity", "rejected")
    require(root is not None, "invalid_capture", "Capture storage unavailable")
    require(not (Path(root) / (capture_id + ".webm")).is_symlink(),
            "invalid_capture", "Invalid capture location", "rejected")
    path = contained(Path(root), capture_id + ".webm")
    require(not path.is_symlink() and path.parent == Path(root).resolve(),
            "invalid_capture", "Invalid capture location", "rejected")
    return path


class CaptureStore:
    def __init__(self):
        self._temp = tempfile.TemporaryDirectory(prefix="smartglove-captures-")
        self.root = Path(self._temp.name)
        self._lock = threading.Lock()
        self._closed = False

    def create(self, data):
        require(0 < len(data) <= MAX_CAPTURE_BYTES, "capture_size", "Capture exceeds size limit", "rejected")
        require(data.startswith(b"\x1a\x45\xdf\xa3"), "capture_format", "Expected WebM media", "rejected")
        with self._lock:
            require(not self._closed, "service_stopped", "Capture storage is closed")
            capture_id = uuid.uuid4().hex
            path = capture_path(self.root, capture_id)
            try:
                with path.open("xb") as handle:
                    handle.write(data)
            except BaseException:
                path.unlink(missing_ok=True)
                raise
            return capture_id

    def delete(self, capture_id):
        with self._lock:
            if self._closed:
                return  # Successful close already removed every owned clip.
            capture_path(self.root, capture_id).unlink(missing_ok=True)

    def close(self):
        with self._lock:
            self._temp.cleanup()
            self._closed = True


def resolve_capture(root, capture_id, assets, model):
    path = capture_path(root, capture_id)
    require(path.is_file() and 0 < path.stat().st_size <= MAX_CAPTURE_BYTES,
            "invalid_capture", "Capture unavailable or oversized", "rejected")
    data = path.read_bytes()
    require(data.startswith(b"\x1a\x45\xdf\xa3"), "capture_format", "Expected WebM media", "rejected")
    if model == GH_TCN_MODEL:
        classes = gh_classes()
    elif model in (VISIGN_MODEL, VIDEOMAE_MODEL):
        classes = visign_classes()
    else:
        mapping = decode(verified_file(contained(assets, model.topic_id + ".json"), model.label_map_sha256))
        classes = sorted(({'class_index': index, 'label': label, 'label_id': f'kvsl:{model.topic_id}:{index}'}
                          for label, index in mapping.items()), key=lambda row: row['class_index'])
    require(len(classes) == model.class_count and [c['class_index'] for c in classes] == list(range(model.class_count)),
            "label_mapping", "Invalid pinned vocabulary")
    provenance = {"source_kind": "live_camera_capture", "capture_id": capture_id,
                  "asset": {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)},
                  "capture_transform": "none", "model_input_transform": "none"}
    if model == VIDEOMAE_MODEL:
        provenance['model_input_transform'] = 'shortest-edge-224-center-crop-imagenet'
    elif model == GH_TCN_MODEL:
        provenance['model_input_transform'] = 'resize-360-square-holistic-gh137'
    return ResolvedVideo(LiveCaptureRef(capture_id, model.topic_id), path, None, classes, provenance)
