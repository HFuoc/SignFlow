"""Pinned local research model metadata. No ML imports in the desktop host."""
import hashlib

from .contracts import ModelDescriptor, encode

WORDS = ("Chào", "Chúng ta", "Có thể", "Cảm ơn", "Cứu", "Giúp", "Mua", "Nghe",
         "Nghỉ ngơi", "Nhà", "Nhìn", "Nhớ", "Nói", "Thăm", "Thức dậy", "Thức ăn",
         "Trường học", "Tôi", "Uống", "Xe đạp", "Xin lỗi", "Ăn", "Đi", "Đâu", "Đồng ý")
CHECKPOINT = ".design-cache/visign-baseline-20261012/run1/model.npz"
VISIGN_MODEL = ModelDescriptor(
    provider_id="visign-ridge-25", model_id="visign-ridge-25", topic_id="visign25",
    display_name="ViSign · 25 signs (Experimental)", class_count=25,
    model_version="source-label-baseline-20261012-run1",
    checkpoint_source="local:visign-source-label-baseline-v1", checkpoint_commit="",
    checkpoint_path=CHECKPOINT,
    model_sha256="e525679567b115b2a66202f46ac58c079ec1852241902ca9840606f050a08a31",
    source_commit="", artifact_commit="",
    feature_schema_id="visign-holistic-75xyz-mask-v1",
    preprocessing_id="visign-body-relative-xy-mask-16-v1", expected_input_shape=(3600,),
    expected_output_shape=(1, 25), label_map_sha256=hashlib.sha256(encode(WORDS)).hexdigest(),
    family="visign", experimental=True, requires_topic=False, supported_words=WORDS,
    score_kind="raw_ridge",
)


def classes():
    return [{"class_index": i, "label": label, "label_id": f"visign:visign25:{i}"}
            for i, label in enumerate(WORDS)]
