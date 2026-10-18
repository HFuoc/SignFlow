"""Pinned RGB research provider metadata and acceptance policy. No ML imports."""
from dataclasses import replace
import hashlib
import math

from .adapter import contained, verified_file
from .contracts import decode, map_scores, require
from .experimental import VISIGN_MODEL, WORDS, classes

AUDIT_ROOT = '.design-cache/pretrained-vsl-audit-20261015'
MODEL_IDS = (16, 14, 22, 24, 26, 32, 46, 48, 49, 51, 52, 54, 55, 70, 73, 74, 76, 77, 80, 85, 86, 92, 94, 95, 98)
CONFIG_HASHES = {'config.json': '83f447fbc230cce7645896d18bc07248cf9a48608cbebb5af9b3843da62472a9',
                 'preprocessor_config.json': '4bc9b255ff212041bc28127d4fa0ae1630abca52bb2d882f3e4c0b9e5b763f06'}
VIDEOMAE_MODEL = replace(
    VISIGN_MODEL, provider_id='visign-videomae-25', model_id='visign-videomae-25',
    topic_id='visign25_rgb', family='videomae', display_name='VideoMAE GPU · 25 signs (Experimental)',
    model_version='9759fc78b5d69625317bb658b4104040f9427fa3',
    checkpoint_source='https://huggingface.co/star092304/vi-sign-language-videomae-base',
    checkpoint_commit='9759fc78b5d69625317bb658b4104040f9427fa3',
    checkpoint_path=AUDIT_ROOT + '/publisher/classifier_sequential.pth',
    model_sha256='139dcb459071ea31d2f4a3762d14a2aab6c4a8d9dbffc936a2274c2caee33bff',
    modality='rgb_video', feature_schema_id='rgb-uint8-224-square-v1',
    preprocessing_id='videomae-rgb-16-uniform-imagenet-v1', expected_input_shape=(1, 16, 3, 224, 224),
    score_kind='uncalibrated_softmax_subset')


def verify_checkpoint(path):
    with path.open('rb') as stream:
        require(hashlib.file_digest(stream, 'sha256').hexdigest() == VIDEOMAE_MODEL.model_sha256,
                'model_hash', 'VideoMAE checkpoint differs from the pinned model')


def artifacts(workspace):
    root = contained(workspace, AUDIT_ROOT)
    for directory, filename in (('cuda-deps', 'torch/__init__.py'), ('deps', 'transformers/__init__.py')):
        require(contained(root, directory + '/' + filename).is_file(), 'missing_runtime',
                'VideoMAE CUDA environment is unavailable')
    publisher = contained(root, 'publisher')
    configs = {name: decode(verified_file(contained(publisher, name), sha, 'model_configuration'))
               for name, sha in CONFIG_HASHES.items()}
    return root, configs


def decide(probabilities, *, phase='final', duration_ms=1000, stable_updates=1, boundary=None):
    """Heuristic abstention, not calibrated open-set recognition or accuracy evidence."""
    require(len(probabilities) == 100 and all(type(p) in (float, int) and math.isfinite(p)
            and 0 <= p <= 1 for p in probabilities) and abs(sum(probabilities) - 1) < 1e-5,
            'invalid_scores', 'Invalid native VideoMAE probabilities')
    ranked = sorted(range(100), key=lambda i: (-probabilities[i], i))
    winner = ranked[0]
    quality = {'experimental': True, 'source_semantics_verified': False, 'unknown_rejection': False,
               'acceptance_policy': 'videomae-conservative-v1', 'native_class_count': 100,
               'native_top1_id': winner, 'native_top1_score': probabilities[winner],
               'native_margin': probabilities[winner] - probabilities[ranked[1]],
               'subset_mass': sum(probabilities[i] for i in MODEL_IDS), 'stable_updates': stable_updates}
    reason = None
    if boundary in ('max_duration', 'frame_gap'):
        reason = 'The complete sign was not captured. Hold still, then try one sign again.'
    elif duration_ms < 700:
        reason = 'Keep signing; the captured movement is too short.'
    elif winner not in MODEL_IDS:
        reason = 'This movement does not match the supported 25 signs clearly enough.'
    elif probabilities[winner] < (.90 if phase == 'provisional' else .80) or quality['native_margin'] < .25:
        reason = 'Not confident enough to name this sign. Try one complete sign again.'
    elif phase == 'provisional' and (duration_ms < 1000 or stable_updates < 2):
        reason = 'Keep signing; waiting for a stable prediction.'
    quality['native_winner_supported'] = winner in MODEL_IDS
    if reason and duration_ms >= 700 and boundary not in ('max_duration', 'frame_gap') and phase == 'final':
        # Diagnostic rankings retain native100 probability mass, never a confirmed word.
        quality['candidate_top_k'] = list(map_scores([probabilities[i] for i in MODEL_IDS], classes(), VIDEOMAE_MODEL))
    return (() if reason else map_scores([probabilities[i] for i in MODEL_IDS], classes(), VIDEOMAE_MODEL),
            quality, reason)
