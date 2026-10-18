"""Bounded, RAM-only camera stream contracts and host ownership. No ML imports."""
from collections import deque
import math
from statistics import median
from pathlib import Path
import struct
import threading
import time
import uuid

from .contracts import PredictionResult, RecognitionError, decode, encode, prediction_identity, require
from .experimental import VISIGN_MODEL, classes
from .videomae import VIDEOMAE_MODEL
from .gh_tcn import GH_TCN_MODEL, classes as gh_classes
from .registry import get_model
from .persistent_client import PersistentRecognitionWorkerClient
from .service import validate_prediction
from .worker_client import WorkerConfig, WORKER_MODULE

STREAM_PROTOCOL = "smartglove-recognition-stream-v1"
STREAM_PREPROCESSING = "visign-body-relative-xy-mask-16-stream-v1"
MAX_FRAME_BYTES = 8 * 1024 * 1024
MAX_HEADER_BYTES = 1024
MAX_FPS = 60
IDLE_TIMEOUT_S = 10
SESSION_TIMEOUT_S = 30 * 60
OPERATION_TIMEOUT_S = 30
PRE_ROLL_MS = 400
END_HOLD_MS = 350
MAX_SEGMENT_MS = 5500
MAX_GAP_MS = 750
MAX_HISTORY = math.ceil((MAX_SEGMENT_MS + PRE_ROLL_MS) * MAX_FPS / 1000) + 2
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def limits():
    return {"max_fps": MAX_FPS, "max_frame_bytes": MAX_FRAME_BYTES,
            "manual_finish": True,
            "frame_formats": ["rgba8", "png"],
            "max_width": 1920, "max_height": 1080, "max_pixels": 1920 * 1080,
            "idle_timeout_ms": IDLE_TIMEOUT_S * 1000,
            "session_timeout_ms": SESSION_TIMEOUT_S * 1000,
            "pre_roll_ms": PRE_ROLL_MS, "end_hold_ms": END_HOLD_MS,
            "max_segment_ms": MAX_SEGMENT_MS}


def validate_png(data):
    require(isinstance(data, bytes) and 33 <= len(data) <= MAX_FRAME_BYTES,
            "stream_size", "PNG frame exceeds the camera limit")
    require(data[:8] == PNG_SIGNATURE and data[8:16] == b"\x00\x00\x00\rIHDR",
            "stream_media", "Camera frames must be lossless PNG")
    width, height = struct.unpack(">II", data[16:24])
    require(16 <= width <= 1920 and 16 <= height <= 1080 and width * height <= 1920 * 1080
            and data[24] == 8 and data[25] in (2, 6),
            "stream_media", "Camera PNG resolution or color format is unsupported")
    return width, height


def validate_frame_pixels(header, data):
    """Validate lossless media before allocating/decoding in the isolated worker."""
    if header.get("format") != "rgba8":
        return validate_png(data)
    width, height = header["width"], header["height"]
    require(isinstance(data, bytes) and len(data) == width * height * 4
            and len(data) <= MAX_FRAME_BYTES, "stream_size", "Invalid RGBA camera frame size")
    return width, height


def unpack_frame(data):
    require(isinstance(data, bytes) and 4 < len(data) <= MAX_FRAME_BYTES + MAX_HEADER_BYTES + 4,
            "stream_size", "Camera frame exceeds the transport limit")
    size = struct.unpack(">I", data[:4])[0]
    require(0 < size <= MAX_HEADER_BYTES and 4 + size < len(data),
            "stream_protocol", "Invalid camera frame header")
    try:
        header = decode(data[4:4 + size])
    except (ValueError, UnicodeError):
        raise RecognitionError("stream_protocol", "Invalid camera frame header") from None
    validate_frame_header(header)
    pixels = data[4 + size:]
    validate_frame_pixels(header, pixels)
    return header, pixels


def validate_frame_header(header):
    base = {"type", "sequence", "timestamp_ms"}
    media = {"format", "width", "height"}
    require(isinstance(header, dict) and set(header) in (base, base | media,
            base | {"finish_segment"}, base | media | {"finish_segment"})
            and header["type"] == "frame" and type(header["sequence"]) is int
            and 0 <= header["sequence"] <= 10_000_000
            and type(header["timestamp_ms"]) in (int, float)
            and math.isfinite(header["timestamp_ms"]) and 0 <= header["timestamp_ms"] <= 1e12,
            "stream_protocol", "Invalid camera frame identity")
    if "finish_segment" in header:
        require(type(header["finish_segment"]) is int and 1 <= header["finish_segment"] <= 10_000_000,
                "stream_protocol", "Invalid finish segment identity")
    if "format" in header:
        require(header["format"] == "rgba8" and type(header["width"]) is int
                and type(header["height"]) is int and 16 <= header["width"] <= 1920
                and 16 <= header["height"] <= 1080,
                "stream_media", "Unsupported camera pixel format or dimensions")


class FrameClock:
    """Strict sequence/time order and a small arrival-rate bucket, never a queue."""
    def __init__(self):
        self.sequence = -1
        self.timestamp = None
        self.arrivals = deque(maxlen=MAX_FPS + 2)

    def accept(self, header, now):
        validate_frame_header(header)
        require(header["sequence"] == self.sequence + 1, "stream_sequence", "Camera sequence is out of order")
        stamp = header["timestamp_ms"]
        require(self.timestamp is None or stamp - self.timestamp >= 1000 / MAX_FPS - 1,
                "stream_timestamp", f"Camera timestamps must advance at no more than {MAX_FPS} FPS")
        while self.arrivals and now - self.arrivals[0] >= 1:
            self.arrivals.popleft()
        require(len(self.arrivals) < MAX_FPS + 1, "stream_rate", f"Camera stream exceeded {MAX_FPS} FPS")
        self.arrivals.append(now)
        self.sequence, self.timestamp = header["sequence"], stamp


class SignSegmenter:
    """Timestamped onset history and bounded candidates; boundaries are experimental."""
    def __init__(self, *, end_hold_ms=END_HOLD_MS, prediction_interval_ms=250,
                 end_on_missing_hands=True, motion_window=1):
        self.end_hold_ms = end_hold_ms
        self.prediction_interval_ms = prediction_interval_ms
        self.end_on_missing_hands = end_on_missing_hands
        self.motion_window = motion_window
        self.motion_history = deque([0.] * (motion_window - 1), maxlen=motion_window)
        self.history = deque(maxlen=MAX_HISTORY)
        self.state = "ready"
        self.segment_id = 0
        self.started = self.candidate = self.quiet = self.last = None
        self.last_active = self.last_prediction = None
        self.await_quiet = False

    def reset(self):
        self.history.clear()
        self.motion_history.clear()
        self.motion_history.extend([0.] * (self.motion_window - 1))
        self.state = "ready"
        self.started = self.candidate = self.quiet = self.last = None
        self.last_active = self.last_prediction = None
        self.await_quiet = False

    def sample(self, stamp, motion, feature, hands, *, finish_segment=None):
        reset_reason = None
        if self.last is not None and stamp - self.last > MAX_GAP_MS:
            self.reset()
            reset_reason = "frame_gap"
        self.last = stamp
        # Three-sample median for RGB boundaries rejects isolated landmark jumps.
        # It changes segmentation only; stored RGB and model inputs stay intact.
        self.motion_history.append(motion if hands else 0.)
        motion = median(self.motion_history)
        self.history.append((stamp, feature, hands))
        while self.history and stamp - self.history[0][0] > MAX_SEGMENT_MS + PRE_ROLL_MS:
            self.history.popleft()
        moving = hands and motion >= .035
        quiet = (not hands and self.end_on_missing_hands) or (hands and motion <= .020)
        if self.await_quiet:
            # After a completed/discarded segment, lowering hands out of view is
            # a valid reset. It must not finish an active, occluded sign.
            rearm_quiet = quiet or not hands
            self.quiet = (self.quiet if self.quiet is not None else stamp) if rearm_quiet else None
            if self.quiet is not None and stamp - self.quiet >= self.end_hold_ms:
                self.await_quiet = False
                self.quiet = None
            return None, (), reset_reason
        if self.state == "ready":
            if moving:
                if self.candidate is None:
                    self.candidate = stamp
                elif stamp - self.candidate >= 100:
                    self.segment_id += 1
                    self.started = max(self.history[0][0], self.candidate - PRE_ROLL_MS)
                    self.last_active = stamp
                    self.last_prediction = None
                    self.state = "moving"
            elif quiet or not hands:
                self.candidate = None
        if self.state == "ready":
            return None, (), reset_reason
        if quiet:
            self.quiet = self.quiet if self.quiet is not None else stamp
            self.state = "ending"
        elif moving or not hands:
            self.quiet = None
            self.state = "moving"
            self.last_active = stamp
        elif self.quiet is None:
            # Neutral motion retains the current state, like onset hysteresis.
            self.last_active = stamp
        maximum = stamp - self.started >= MAX_SEGMENT_MS
        ended = self.quiet is not None and stamp - self.quiet >= self.end_hold_ms
        # A user can mark the end without waiting for perfect tracker stillness.
        # Bind to the observed segment so a delayed click cannot end the next one.
        manual = finish_segment == self.segment_id and reset_reason is None
        phase = "final" if maximum or ended or manual else "provisional"
        selected = tuple(item for item in self.history if item[0] >= self.started and
                         (self.quiet is None or item[0] <= self.last_active + 100))
        if phase == "final":
            self.state = "ready"
            self.await_quiet = (maximum or manual) and not ended
            self.candidate = self.quiet = None
            self.started = self.last_active = self.last_prediction = None
            self.history.clear()
            return phase, selected, "max_duration" if maximum else "manual_finish" if manual else reset_reason
        if self.prediction_interval_ms is not None and len(selected) >= 5 and stamp - selected[0][0] >= 300 and (
                self.last_prediction is None or stamp - self.last_prediction >= self.prediction_interval_ms):
            self.last_prediction = stamp
            return phase, selected, reset_reason
        return None, (), reset_reason


def stream_prediction(stream_id, segment_id, sequence, model=VISIGN_MODEL):
    identity = prediction_identity(model)
    identity["preprocessing_id"] = (model.preprocessing_id + '-stream-palm-recovery-v2' if model == GH_TCN_MODEL
                                   else model.preprocessing_id + '-stream-v1' if model == VIDEOMAE_MODEL
                                    else STREAM_PREPROCESSING)
    return PredictionResult(request_id=f"{stream_id}-{sequence}", sample_id=None,
                            source_kind="live_camera_stream", topic_id=model.topic_id,
                            source_provenance={"stream_id": stream_id, "segment_id": segment_id},
                            **identity)


class StreamWorkerClient(PersistentRecognitionWorkerClient):
    """Reuse bounded pipe readers, cancellation, process groups and reap semantics."""
    protocol = STREAM_PROTOCOL

    def __init__(self, config, stream_id, model=VISIGN_MODEL):
        super().__init__(config)
        self.stream_id = stream_id
        self.model = model

    def _command(self, executable, hello_id):
        return [str(executable), "-X", "utf8", "-m", WORKER_MODULE, "--stream", hello_id,
                encode({"workspace": str(Path(self.config.workspace).resolve()),
                        "python": self.config.python, "stream_id": self.stream_id,
                        "provider_id": self.model.provider_id}).decode("utf-8")]

    def _validate_hello(self, hello):
        fields = {"protocol_version", "request_id", "status", "stream_id", "pid"}
        require(set(hello) in (fields, fields | {'provider_id'})
                and hello.get('provider_id', VISIGN_MODEL.provider_id) == self.model.provider_id
                and hello["status"] == "ready" and hello["stream_id"] == self.stream_id
                and type(hello["pid"]) is int
                and (self._group.contains(hello["pid"]) if self._group else hello["pid"] == self.process.pid),
                "worker_protocol", "Invalid camera worker handshake")

    def exchange(self, header=None, png=None, cancel_event=None):
        deadline = time.monotonic() + (self.config.timeout_s if header is None and self.model == VIDEOMAE_MODEL
                                      else OPERATION_TIMEOUT_S)
        with self._serial:
            try:
                require(not self._closed.is_set(), "service_stopped", "Camera stream has stopped")
                if self.process is None:
                    self._start(deadline, cancel_event)
                if header is None:
                    return None
                request_id = f"{self.stream_id}-{header['sequence']}"
                self._enqueue(encode({"protocol_version": STREAM_PROTOCOL, "operation": "frame",
                                      "request_id": request_id, "header": header, "bytes": len(png)}) + png,
                              request_id)
                response = self._wait(deadline, cancel_event)
                require(set(response) == {"protocol_version", "request_id", "frame"}
                        and isinstance(response["frame"], dict), "worker_protocol", "Invalid camera response")
                frame = response["frame"]
                require(set(frame) == {"type", "sequence", "timestamp_ms", "state", "phase", "segment_id", "prediction", "quality"}
                        and frame["type"] == "frame" and frame["sequence"] == header["sequence"]
                        and frame["timestamp_ms"] == header["timestamp_ms"]
                        and frame["state"] in ("ready", "moving", "ending")
                        and frame["phase"] in (None, "provisional", "final")
                        and type(frame["segment_id"]) is int and frame["segment_id"] >= 0
                        and isinstance(frame["quality"], dict), "worker_protocol", "Invalid camera response identity")
                if frame["phase"] is None:
                    require(frame["prediction"] is None, "worker_protocol", "Unexpected camera prediction")
                else:
                    expected = stream_prediction(self.stream_id, frame["segment_id"], header["sequence"], self.model)
                    vocabulary = gh_classes() if self.model == GH_TCN_MODEL else classes()
                    frame["prediction"] = validate_prediction(frame["prediction"], expected, vocabulary).to_dict()
                return frame
            except (RecognitionError, OSError, ValueError, TypeError, KeyError) as exc:
                self._reap()
                exc = self._classified_failure(exc)
                if isinstance(exc, RecognitionError):
                    raise exc
                raise RecognitionError("worker_protocol", "Camera worker communication failed") from None


class StreamLease:
    def __init__(self, owner, config, factory, model=VISIGN_MODEL):
        self.owner, self.stream_id = owner, str(uuid.uuid4())
        self.cancelled = threading.Event()
        self.model = model
        self.worker = factory(config, self.stream_id) if model == VISIGN_MODEL else factory(config, self.stream_id, model)
        self.clock = FrameClock()
        self.created = time.monotonic()

    def start(self):
        self.worker.exchange(cancel_event=self.cancelled)
        return {"type": "ready", "protocol": STREAM_PROTOCOL, "stream_id": self.stream_id, **limits(),
                "provider_id": self.model.provider_id,
                "end_hold_ms": 500 if self.model in (VIDEOMAE_MODEL, GH_TCN_MODEL) else END_HOLD_MS}

    def frame(self, data):
        require(not self.cancelled.is_set(), "cancelled", "Camera stream stopped")
        require(time.monotonic() - self.created < SESSION_TIMEOUT_S,
                "stream_timeout", "Camera stream reached its time limit; enable Auto again")
        header, png = unpack_frame(data)
        self.clock.accept(header, time.monotonic())
        return self.worker.exchange(header, png, self.cancelled)

    def cancel(self):
        self.cancelled.set()

    def close(self):
        self.cancel()
        self.worker.shutdown()


class StreamingService:
    def __init__(self, config=None, *, factory=StreamWorkerClient):
        self.config = config or WorkerConfig()
        self.factory = factory
        self._lock = threading.Lock()
        self.active = None
        self.closed = False

    def acquire(self, owner, provider_id=VISIGN_MODEL.provider_id):
        model = get_model(provider_id)
        require(model in (VISIGN_MODEL, VIDEOMAE_MODEL, GH_TCN_MODEL), 'unsupported_provider', 'Model does not support streaming')
        with self._lock:
            require(not self.closed, "service_stopped", "Camera recognition has stopped")
            require(self.active is None, "stream_busy", "Another camera stream is already active")
            self.active = StreamLease(owner, self.config, self.factory, model)
            return self.active

    def release(self, lease):
        # Keep ownership if teardown fails: a second worker must not overlap an
        # unverified first process. A later shutdown can retry the same lease.
        lease.close()
        with self._lock:
            if self.active is lease:
                self.active = None

    def shutdown(self):
        with self._lock:
            self.closed = True
            lease = self.active
        if lease:
            self.release(lease)
