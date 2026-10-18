"""Pinned CPU graphs; inference threads do not change models or coordinates.

Heavy imports remain inside the isolated worker. Never cache/re-emit old points.
"""
from pathlib import Path
import math
from types import SimpleNamespace


def threaded_graph(module, filename, side_inputs, outputs):
    import mediapipe as mp
    from mediapipe.framework import calculator_pb2
    from mediapipe.calculators.tensor import inference_calculator_pb2
    from mediapipe.python._framework_bindings import validated_graph_config
    from mediapipe.python.solution_base import SolutionBase
    from .contracts import require

    require(mp.__version__ == "0.10.14", "runtime_version", "Unsupported tracking runtime")
    validated = validated_graph_config.ValidatedGraphConfig()
    validated.initialize(binary_graph_path=str(Path(mp.__file__).parent / "modules" / module / filename))
    graph = calculator_pb2.CalculatorGraphConfig()
    graph.ParseFromString(validated.binary_config)
    extension = inference_calculator_pb2.InferenceCalculatorOptions.ext
    changed = 0
    for node in graph.node:
        # Some face calculators use node_options instead. Do not create an empty
        # legacy options block for them: that overrides their model configuration.
        if node.calculator == "InferenceCalculatorCpu" and node.options.HasExtension(extension):
            options = node.options.Extensions[extension]
            if options.delegate.HasField("xnnpack"):
                options.delegate.xnnpack.num_threads = 2
                changed += 1
    require(changed > 0, "runtime_version", "Tracking graph differs from verified runtime")
    return SolutionBase(graph_config=graph, side_inputs=side_inputs, outputs=outputs)


class CpuHolistic:
    """The same complexity-1 Holistic graphs, thresholds and smoothing as before."""
    def __init__(self):
        self.graph = threaded_graph("holistic_landmark", "holistic_landmark_cpu.binarypb",
            dict(model_complexity=1, smooth_landmarks=True, enable_segmentation=False,
                 smooth_segmentation=True, refine_face_landmarks=False, use_prev_landmarks=True),
            ["pose_landmarks", "pose_world_landmarks", "left_hand_landmarks",
             "right_hand_landmarks", "face_landmarks", "segmentation_mask"])

    def process(self, image):
        result = self.graph.process({"image": image})
        for name in ("pose_landmarks", "pose_world_landmarks"):
            group = getattr(result, name)
            if group:
                for point in group.landmark:
                    point.ClearField("presence")
        return result

    def reset(self):
        self.graph.reset()

    def close(self):
        self.graph.close()


def recovery_targets(result):
    """Only look for a missing hand whose current pose wrist is actually visible."""
    pose = result.pose_landmarks
    if pose is None:
        return []
    return [side for side, name in enumerate(("left_hand_landmarks", "right_hand_landmarks"))
            if getattr(result, name) is None and pose.landmark[15 + side].visibility >= .5
            and 0 <= pose.landmark[15 + side].x <= 1 and 0 <= pose.landmark[15 + side].y <= 1]


def associate_hands(result, candidates):
    """Conservative current-frame wrist association, independent of camera mirroring.

    Reject ambiguous/crossed wrists and duplicates; never infer left/right from x
    ordering or reuse a previously seen landmark when a hand is missing now.
    """
    targets = recovery_targets(result)
    groups = {name: getattr(result, name) for name in
              ("pose_landmarks", "left_hand_landmarks", "right_hand_landmarks")}
    if not targets:
        return SimpleNamespace(**groups), []
    pose = result.pose_landmarks.landmark
    xy = lambda p: (p.x, p.y)
    radius = min(.12, math.dist(xy(pose[11]), xy(pose[12])) * .45)
    proposals = []
    for group in candidates or ():
        if len(group.landmark) != 21 or any(not all(math.isfinite(v) for v in (p.x, p.y, p.z))
                                            or not (0 <= p.x <= 1 and 0 <= p.y <= 1) for p in group.landmark):
            continue
        wrist = xy(group.landmark[0])
        distances = [math.dist(wrist, xy(pose[i])) for i in (15, 16)]
        side = 0 if distances[0] < distances[1] else 1
        if side not in targets or distances[side] >= radius or distances[side] * 1.5 >= distances[1-side]:
            continue
        other = groups[("right_hand_landmarks", "left_hand_landmarks")[side]]
        if other and math.dist(wrist, xy(other.landmark[0])) < radius:
            continue
        proposals.append((distances[side], side, group))
    recovered = []
    for _, side, group in sorted(proposals, key=lambda item: item[0]):
        name = ("left_hand_landmarks", "right_hand_landmarks")[side]
        if groups[name] is None:
            groups[name] = group
            recovered.append("left" if side == 0 else "right")
    return SimpleNamespace(**groups), recovered


class HandRecovery:
    """Probe at 10 Hz; after recovery, track fresh frames until Holistic takes over."""
    def __init__(self):
        self.graph = threaded_graph("hand_landmark", "hand_landmark_tracking_cpu.binarypb",
            dict(model_complexity=1, num_hands=2, use_prev_landmarks=False), ["multi_hand_landmarks"])
        self.last_attempt = None
        self.active = False

    def process(self, image, result, timestamp_ms):
        if not recovery_targets(result):
            self.active = False
            self.last_attempt = None
            return result, [], False
        if not self.active and self.last_attempt is not None and timestamp_ms - self.last_attempt < 100:
            return result, [], False
        # Stateless palm detection uses this image only. Restarting the whole
        # graph for every probe would repeatedly pay model warm-up latency.
        self.last_attempt = timestamp_ms
        found = self.graph.process({"image": image})
        merged, recovered = associate_hands(result, found.multi_hand_landmarks)
        self.active = bool(recovered)
        return merged, recovered, True

    def reset(self):
        self.last_attempt = None
        self.active = False
        self.graph.reset()

    def close(self):
        self.graph.close()
