"""Failure classification must never expose worker paths or arbitrary diagnostics."""
import pytest

from app.desktop_collector.recognition.contracts import RecognitionError
from app.desktop_collector.recognition.runtime_errors import MESSAGES, runtime_failure


@pytest.mark.parametrize('error,diagnostics,code', [
    (RuntimeError('CUDA error: out of memory at private/path'), '', 'cuda_memory'),
    (MemoryError('private/path'), '', 'host_memory'),
    (None, 'OpenBLAS error: Memory allocation failed private/path', 'host_memory'),
    (None, 'DefaultCPUAllocator: not enough memory private/path', 'host_memory'),
    (RecognitionError('model_hash', 'private/path'), '', 'model_hash'),
    (None, 'SMARTGLOVE_WORKER_ERROR: missing_runtime private/path', 'missing_runtime'),
])
def test_known_failure_uses_only_fixed_safe_message(error, diagnostics, code):
    failure = runtime_failure(error, diagnostics)
    assert failure.code == code
    assert str(failure) == MESSAGES[code]
    assert 'private/path' not in str(failure)


def test_unknown_diagnostic_is_not_exposed_or_misclassified():
    assert runtime_failure(RuntimeError('private/path: something else')) is None
    assert runtime_failure(diagnostics='CUDA out of memory' + 'x' * 65536) is None


def test_wrapped_memory_error_is_classified():
    error = RuntimeError('wrapper')
    error.__cause__ = MemoryError()
    assert runtime_failure(error).code == 'host_memory'
