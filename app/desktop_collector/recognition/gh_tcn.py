"""Pinned VSL-GH epoch-44 camera experiment; safe to import in the desktop host."""
import hashlib
import math

from .contracts import ModelDescriptor, encode, require

WORDS = ("TÔI", "KHÁM", "ĐẾN", "BỆNH", "CÓ", "ĐO", "HUYẾT-ÁP", "MUỐN", "RỒI",
         "BÁC-SĨ", "CẢM-THẤY", "CẦN", "GIẤY", "CHƯA", "MẠCH", "NỘP", "SỐ", "VIẾT",
         "ĐÂY", "BẢO-HIỂM", "ĐAU", "ĐI", "ĐỢI", "Ở-ĐÂU", "PHÒNG")
NATIVE_LABELS = (*WORDS, "__OTHER__")
NORMALIZATION_SHA256 = "e942bd2c80dbcd0ebc22424cdbfff436957cc8e281fb0db61e1a343591c3d25b"
# Frozen S05 validation selection; never tune this from webcam/test outcomes.
ACCEPT_THRESHOLD = 0.9992662072181703
GH_TCN_MODEL = ModelDescriptor(
    provider_id="vsl-gh-tcn-25", model_id="vsl-gh-tcn-25", topic_id="vsl_gh25",
    display_name="TCN · 25 signs + OTHER (Experimental)", class_count=25,
    model_version="gh25-other-20261018-epoch44",
    checkpoint_source="local:vsl-gh-source-label-experiment", checkpoint_commit="",
    checkpoint_path=".design-cache/multiuser-data-20261018/gh25/background-run1/tcn.pt",
    model_sha256="9e782ad74e8d56b3d7c158dfecdc440fe38abff403a4a3b5e94667d1c2afe12e",
    source_commit="", artifact_commit="", feature_schema_id="gh137-body-hands279-32-v1",
    preprocessing_id="gh137-resize360-body-hands279-32-v1",
    expected_input_shape=(1, 279, 32), expected_output_shape=(1, 26),
    label_map_sha256=hashlib.sha256(encode(WORDS)).hexdigest(), family="gh_tcn",
    experimental=True, requires_topic=False, supported_words=WORDS,
    score_kind="uncalibrated_softmax_subset",
)


def classes():
    return [{"class_index": i, "label": word, "label_id": f"gh_tcn:vsl_gh25:{i}"}
            for i, word in enumerate(WORDS)]


def acceptance(scores):
    """Native 26-way probabilities, without renormalizing the 25 public words."""
    require(len(scores) == 26 and all(type(s) in (float, int) and math.isfinite(s)
                                    and 0 <= s <= 1 for s in scores)
            and abs(sum(scores) - 1) < 1e-5,
            "invalid_scores", "Invalid native TCN probabilities", "rejected")
    index = max(range(26), key=lambda i: scores[i])
    if index == 25:
        return index, "Sign outside the supported vocabulary. Try one of the 25 listed signs."
    if scores[index] < ACCEPT_THRESHOLD:
        return index, "Uncertain sign. Capture one complete sign with your upper body and hands visible."
    return index, None
