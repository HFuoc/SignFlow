"""Offline CUDA RGB inference. Imported only by the explicitly selected ML worker."""
from collections import OrderedDict
from dataclasses import replace
import hashlib
import importlib.metadata
import io
import math
import os
from pathlib import Path
import pickle
import sys
import time
import zipfile

from .contracts import require
from .videomae import VIDEOMAE_MODEL, artifacts, decide


def bootstrap(workspace):
    root, _ = artifacts(Path(workspace))
    require('torch' not in sys.modules, 'runtime_version', 'Select CUDA before loading ML libraries')
    sys.path[:0] = [str(root / 'cuda-deps'), str(root / 'deps')]
    os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1')
    for package, version in {'torch': '2.6.0+cu124', 'transformers': '4.57.1',
                             'numpy': '1.26.4', 'mediapipe': '0.10.14',
                             'opencv-contrib-python': '4.10.0.84'}.items():
        require(importlib.metadata.version(package) == version, 'runtime_version',
                'VideoMAE runtime differs from the verified environment')


def tensor_spec(storage, offset, size, stride, requires_grad, hooks, metadata=None):
    require(isinstance(storage, tuple) and len(storage) == 3 and type(offset) is int and offset == 0
            and isinstance(size, tuple) and isinstance(stride, tuple) and len(size) == len(stride)
            and all(type(x) is int and x >= 0 for x in (*size, *stride))
            and requires_grad is False and not hooks and metadata is None,
            'model_compatibility', 'Invalid numeric tensor description')
    return storage, size, stride


class NumericReader(pickle.Unpickler):
    def find_class(self, module, name):
        allowed = {('collections', 'OrderedDict'): OrderedDict, ('torch', 'FloatStorage'): 'float32',
                   ('torch._utils', '_rebuild_tensor_v2'): tensor_spec}
        require((module, name) in allowed, 'model_compatibility', 'Unsupported checkpoint global')
        return allowed[module, name]

    def persistent_load(self, value):
        require(isinstance(value, tuple) and len(value) == 5, 'model_compatibility', 'Invalid storage')
        kind, dtype, key, location, count = value
        require(kind == 'storage' and dtype == 'float32' and isinstance(key, str) and key.isdecimal()
                and location in ('cpu', 'cuda:0') and type(count) is int and 0 < count < 100_000_000,
                'model_compatibility', 'Invalid numeric storage')
        return dtype, key, count


def numeric_weights(path):
    import numpy as np
    import torch
    # Verify and read the same open file; never execute publisher notebook/pickle functions.
    with Path(path).open('rb') as handle:
        require(hashlib.file_digest(handle, 'sha256').hexdigest() == VIDEOMAE_MODEL.model_sha256,
                'model_hash', 'VideoMAE checkpoint differs from the pinned model')
        handle.seek(0)
        with zipfile.ZipFile(handle) as archive:
            name = next(n for n in archive.namelist() if n.endswith('/data.pkl'))
            require(archive.getinfo(name).file_size < 1_000_000, 'model_compatibility', 'Metadata too large')
            specs = NumericReader(io.BytesIO(archive.read(name))).load()
            require(isinstance(specs, OrderedDict) and 100 < len(specs) < 500,
                    'model_compatibility', 'Invalid state dictionary')
            state = {}
            for key, (storage, shape, stride) in specs.items():
                _, storage_id, count = storage
                require(isinstance(key, str) and math.prod(shape) == count
                        and stride == tuple(math.prod(shape[i + 1:]) for i in range(len(shape))),
                        'model_compatibility', 'Invalid tensor shape/stride')
                item = archive.getinfo(name[:-8] + 'data/' + storage_id)
                require(item.file_size == count * 4, 'model_compatibility', 'Invalid storage size')
                values = np.frombuffer(archive.read(item), dtype='<f4').copy().reshape(shape)
                require(np.isfinite(values).all(), 'model_compatibility', 'Nonfinite weights')
                state[key] = torch.from_numpy(values)
    return state


class RGBModel:
    def __init__(self, checkpoint):
        import torch
        from transformers import VideoMAEConfig, VideoMAEForVideoClassification, VideoMAEImageProcessor
        self.torch = torch
        require(torch.cuda.is_available(), 'cuda_unavailable',
                'VideoMAE requires the NVIDIA GPU. Close heavy apps and retry; V25 remains available.')
        torch.set_num_threads(4)
        torch.backends.cuda.matmul.allow_tf32 = False
        torch.backends.cudnn.allow_tf32 = False
        # Avoid the cuDNN Conv3d warmup OOM reproduced on the local RTX 2050.
        # Native CUDA retains FP32/weights while bypassing that cuDNN path.
        torch.backends.cudnn.enabled = False
        checkpoint = Path(checkpoint)
        _, configs = artifacts(checkpoint.parents[3])
        config = VideoMAEConfig.from_dict(configs['config.json'])
        self.model = VideoMAEForVideoClassification(config)
        self.model.classifier = torch.nn.Sequential(torch.nn.LayerNorm(768), torch.nn.Dropout(.3),
                                                    torch.nn.Linear(768, 100))
        state = numeric_weights(checkpoint)
        self.model.load_state_dict(state, strict=True)
        del state
        self.model.eval().to('cuda:0')
        self.processor = VideoMAEImageProcessor.from_pretrained(str(checkpoint.parent), local_files_only=True)
        self.device_name = torch.cuda.get_device_name(0)
        # Initialize kernels before acknowledging stream readiness; no real camera pixels.
        with torch.inference_mode():
            self.model(pixel_values=torch.zeros((1, 16, 3, 224, 224), device='cuda:0'))
        torch.cuda.synchronize()

    def crop(self, rgb):
        """Store only bounded 224-square uint8 RGB, using publisher spatial preprocessing."""
        values = self.processor([[rgb]], do_rescale=False, do_normalize=False, return_tensors='np')['pixel_values']
        return values[0, 0].transpose(1, 2, 0).copy()

    def infer(self, frames):
        import numpy as np
        indices = np.linspace(0, len(frames) - 1, 16).astype(int)
        inputs = self.processor([frames[i] for i in indices], return_tensors='pt')
        inputs = {k: v.to('cuda:0') for k, v in inputs.items()}
        self.torch.cuda.synchronize()
        start = time.perf_counter()
        with self.torch.inference_mode():
            logits = self.model(**inputs).logits[0]
        self.torch.cuda.synchronize()
        ms = (time.perf_counter() - start) * 1000
        require(logits.shape == (100,) and bool(self.torch.isfinite(logits).all()),
                'invalid_scores', 'VideoMAE produced invalid logits')
        return self.torch.softmax(logits, dim=-1).cpu().tolist(), ms


class ClipRuntime:
    def __init__(self):
        self.rgb_model = None
        self.visign_holistic = None

    def close(self):
        if self.visign_holistic is not None:
            self.visign_holistic.close()
        self.rgb_model = None


def predict(video, checkpoint, result, runtime):
    import cv2
    import mediapipe as mp
    import numpy as np
    from .captures import MAX_CAPTURE_SECONDS
    started = time.perf_counter()
    runtime.rgb_model = runtime.rgb_model or RGBModel(checkpoint)
    load_ms = (time.perf_counter() - started) * 1000
    if runtime.visign_holistic is None:
        runtime.visign_holistic = mp.solutions.holistic.Holistic(
            model_complexity=1, min_detection_confidence=.5, min_tracking_confidence=.5)
    else:
        runtime.visign_holistic.reset()
    capture = cv2.VideoCapture(str(video.path))
    frames, times, hands = [], [], []
    started = time.perf_counter()
    try:
        require(capture.isOpened(), 'video_decode', 'Cannot decode the camera clip', 'insufficient_data')
        width, height = capture.get(cv2.CAP_PROP_FRAME_WIDTH), capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
        require(16 <= width <= 1920 and 16 <= height <= 1080, 'capture_media', 'Invalid camera resolution')
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            stamp = float(capture.get(cv2.CAP_PROP_POS_MSEC)) / 1000
            require(np.isfinite(stamp) and stamp >= 0 and (not times or stamp >= times[-1])
                    and len(frames) < 720 and (not times or stamp - times[0] <= MAX_CAPTURE_SECONDS),
                    'capture_duration', 'Invalid camera clip timing or length', 'rejected')
            require(frame.shape == (int(height), int(width), 3), 'capture_media', 'Camera dimensions changed')
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            found = runtime.visign_holistic.process(rgb)
            hands.append(found.left_hand_landmarks is not None or found.right_hand_landmarks is not None)
            frames.append(runtime.rgb_model.crop(rgb))
            times.append(stamp)
    finally:
        capture.release()
    require(len(frames) >= 5 and times[-1] > times[0], 'capture_short', 'Capture one complete sign.', 'insufficient_data')
    coverage = sum(hands) / len(hands)
    require(coverage >= .5, 'hands_missing', 'Keep your hands and upper body visible.', 'insufficient_data')
    preprocess_ms = (time.perf_counter() - started) * 1000
    probabilities, model_ms = runtime.rgb_model.infer(frames)
    top, quality, reason = decide(probabilities, duration_ms=(times[-1] - times[0]) * 1000)
    return replace(result, status='rejected' if reason else 'ok', top_k=top,
                   error_code='uncertain_sign' if reason else None, rejection_reason=reason,
                   quality={**quality, 'frames_decoded': len(frames), 'frames_selected': 16,
                            'hand_coverage': coverage, 'device': 'cuda:0', 'gpu_name': runtime.rgb_model.device_name,
                            'model_input_transform': 'shortest-edge-224-center-crop-imagenet'},
                   latency_ms={'provider_load': load_ms, 'preprocess': preprocess_ms, 'model': model_ms})
