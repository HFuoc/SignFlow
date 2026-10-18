"""Backend-owned provider whitelist. Entries require recorded real verification."""
from dataclasses import replace
from types import MappingProxyType
import re

from .contracts import MODEL, FEATURE_SCHEMA, PREPROCESSING, require


def build_registry(models):
    result = {}
    topics = set()
    for model in models:
        require(model.provider_id not in result and model.topic_id not in topics,
                "duplicate_provider", "Provider/topic identities must be unique")
        require(model.provider_id == "kvsl-gcn-" + model.topic_id.replace("_", "-") and
                re.fullmatch(r"[a-z][a-z0-9_]*", model.topic_id) is not None and
                model.model_id == model.provider_id and
                model.checkpoint_path == f"app/backend/Model/gcn/{model.topic_id}.pth",
                "provider_metadata", "Invalid provider identity or checkpoint mapping")
        require(all(re.fullmatch(r"[a-f0-9]{64}", value) is not None
                    for value in (model.model_sha256, model.label_map_sha256)) and
                model.source_commit == MODEL.source_commit and model.artifact_commit == MODEL.artifact_commit and
                model.checkpoint_commit == MODEL.checkpoint_commit and model.model_version == MODEL.model_version,
                "provider_metadata", "Provider provenance differs from verified pins")
        require(type(model.class_count) is int and model.class_count >= 3 and
                model.expected_output_shape == (1, model.class_count),
                "output_class_count", "Descriptor output count mismatch")
        require(model.feature_schema_id == FEATURE_SCHEMA and model.preprocessing_id == PREPROCESSING and
                model.preprocessing_version == 1 and model.expected_input_shape == (65, 180) and
                model.family == "kvsl" and model.requires_topic and not model.experimental and
                model.score_kind == "uncalibrated_softmax" and not model.supported_words,
                "feature_mismatch", "Unsupported preprocessing mapping")
        result[model.provider_id] = model
        topics.add(model.topic_id)
    return MappingProxyType(result)


VERIFIED_MODELS = (MODEL,
    replace(MODEL, provider_id='kvsl-gcn-cau-hoi', model_id='kvsl-gcn-cau-hoi', topic_id='cau_hoi',
            display_name='Câu hỏi', class_count=10, expected_output_shape=(1, 10),
            checkpoint_path='app/backend/Model/gcn/cau_hoi.pth',
            model_sha256='f4748abdb2b76fa53ce73e6f8cebb8acc867056ab57212682fc91eb8870f2ef7',
            label_map_sha256='182afe631356225ac330274beaabb8cbe02b8583ef2a8aa2d4f1585de696a135'),
    replace(MODEL, provider_id='kvsl-gcn-chu-cai', model_id='kvsl-gcn-chu-cai', topic_id='chu_cai',
            display_name='Chữ cái', class_count=34, expected_output_shape=(1, 34),
            checkpoint_path='app/backend/Model/gcn/chu_cai.pth',
            model_sha256='68b3c19a7fb4ba066e191779f99b3cf15322b6015804d98919f6755a61fb4482',
            label_map_sha256='50b755cfbe1396dac45ec626dbcea628685d2526a61e740eb2450beaffcd14c3'),
    replace(MODEL, provider_id='kvsl-gcn-gia-dinh', model_id='kvsl-gcn-gia-dinh', topic_id='gia_dinh',
            display_name='Gia đình - Quan hệ gia đình', class_count=24, expected_output_shape=(1, 24),
            checkpoint_path='app/backend/Model/gcn/gia_dinh.pth',
            model_sha256='be4ca3d0b04bfb1a91995af4ff95634cd146eafb8d8e5eddacddf8ae1c09fc58',
            label_map_sha256='85db4f7ad9ccf745ed0b7e928a4a64274fc250236981f9b6aa3ddc5204b26a14'),
    replace(MODEL, provider_id='kvsl-gcn-hanh-dong', model_id='kvsl-gcn-hanh-dong', topic_id='hanh_dong',
            display_name='Hành động', class_count=18, expected_output_shape=(1, 18),
            checkpoint_path='app/backend/Model/gcn/hanh_dong.pth',
            model_sha256='dca3f8fcb208ecb6510c3b08d0e345d310fe17ad6cc0440cc6398657de9f60b6',
            label_map_sha256='ef9c4ff815633ef1e332b467f35e46b66d39256bfb62a339130aa39e3097fdee'),
    replace(MODEL, provider_id='kvsl-gcn-nghe-nghiep', model_id='kvsl-gcn-nghe-nghiep', topic_id='nghe_nghiep',
            display_name='Nghề nghiệp', class_count=6, expected_output_shape=(1, 6),
            checkpoint_path='app/backend/Model/gcn/nghe_nghiep.pth',
            model_sha256='93b7bf6d668e07008901da8cd5e229c5e62bdda1aa5af9df21c5ebb9671c6692',
            label_map_sha256='2987c624416b37c2381f88e0240655858aa0e5b3d2d0ec5326134d2f5fd15810'),
    replace(MODEL, provider_id='kvsl-gcn-so-dem', model_id='kvsl-gcn-so-dem', topic_id='so_dem',
            display_name='Số đếm', class_count=27, expected_output_shape=(1, 27),
            checkpoint_path='app/backend/Model/gcn/so_dem.pth',
            model_sha256='c0cd7f22594f1bfe65a4d974a7ef20ed894103d2f9f08141c75ec63cccd82643',
            label_map_sha256='e4d49d42e958152f35052f564d5098cafcdac31096719540ecf12d3458d1c383'),
    replace(MODEL, provider_id='kvsl-gcn-thoi-tiet', model_id='kvsl-gcn-thoi-tiet', topic_id='thoi_tiet',
            display_name='Thời tiết', class_count=10, expected_output_shape=(1, 10),
            checkpoint_path='app/backend/Model/gcn/thoi_tiet.pth',
            model_sha256='9aaae9592be191942b8fc4c006e95f0296bfcc2c1fb6be29201eaf9aff8ba973',
            label_map_sha256='4212d17c2633290b92950324097dcebc9a3f6fc207b5a9d60bff16ca1cb6888e'),
    replace(MODEL, provider_id='kvsl-gcn-tinh-cach', model_id='kvsl-gcn-tinh-cach', topic_id='tinh_cach',
            display_name='Tính cách - Tính chất', class_count=19, expected_output_shape=(1, 19),
            checkpoint_path='app/backend/Model/gcn/tinh_cach.pth',
            model_sha256='7e2b6077176cad6d12f836fcc47014af386a671cd30049818d1b0b01f393dc6a',
            label_map_sha256='37ac327ff1c028a2692d5fe7ac9aee40448695f41d17f1fcb07d48c30c9639fe'),
    replace(MODEL, provider_id='kvsl-gcn-tu-thong-dung', model_id='kvsl-gcn-tu-thong-dung', topic_id='tu_thong_dung',
            display_name='Từ thông dụng', class_count=7, expected_output_shape=(1, 7),
            checkpoint_path='app/backend/Model/gcn/tu_thong_dung.pth',
            model_sha256='ea644f150b4afae7834fd2996948bf943ba96665edfd03ac6b77902f91bdbb18',
            label_map_sha256='93862a54e6580a019c8e650a336500c2fc33354204d66149587f85af60efa568'),
)
from .experimental import VISIGN_MODEL
from .videomae import VIDEOMAE_MODEL
from .gh_tcn import GH_TCN_MODEL

# The research provider is separately pinned; KVSL registration keeps its strict contract.
REGISTRY = MappingProxyType({**build_registry(VERIFIED_MODELS), VISIGN_MODEL.provider_id: VISIGN_MODEL,
                            VIDEOMAE_MODEL.provider_id: VIDEOMAE_MODEL,
                            GH_TCN_MODEL.provider_id: GH_TCN_MODEL})


def runtime_providers(*, cuda=False):
    return sorted(key for key, model in REGISTRY.items() if (model.family == 'videomae') == cuda)


def get_model(provider_id):
    require(isinstance(provider_id, str) and provider_id in REGISTRY,
            "unsupported_provider", "Provider is not verified", "unsupported")
    return REGISTRY[provider_id]
