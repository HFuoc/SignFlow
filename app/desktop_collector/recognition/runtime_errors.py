"""Small, safe runtime failure messages shared by isolated workers and the host."""
from .contracts import RecognitionError

MARKER = 'SMARTGLOVE_WORKER_ERROR: '
MESSAGES = {
    'cuda_memory': 'VideoMAE could not allocate GPU memory. Close other GPU apps, then enable Auto again or select ViSign.',
    'host_memory': 'Windows could not allocate enough memory for recognition. Free disk space or close heavy apps, then retry.',
    'cuda_unavailable': 'VideoMAE needs the NVIDIA GPU. Check that it is available, or select ViSign.',
    'missing_runtime': 'The local recognition environment is incomplete. Its required packages must be restored.',
    'runtime_version': 'The local recognition environment differs from the verified version.',
    'model_hash': 'The local model file differs from the verified checkpoint.',
    'model_compatibility': 'The local model cannot be loaded with this recognition environment.',
}


def runtime_failure(error=None, diagnostics=''):
    """Inspect a bounded diagnostic; never return its raw paths or arbitrary text."""
    text = diagnostics[-65536:].lower()
    current = error
    for _ in range(4):
        if current is None:
            break
        if isinstance(current, RecognitionError) and current.code in MESSAGES:
            return RecognitionError(current.code, MESSAGES[current.code])
        if isinstance(current, MemoryError) or getattr(current, 'winerror', None) in (8, 14, 1455):
            return RecognitionError('host_memory', MESSAGES['host_memory'])
        text += '\n' + str(current)[-4096:].lower()
        current = current.__cause__ or current.__context__
    for code in MESSAGES:
        if (MARKER + code).lower() in text:
            return RecognitionError(code, MESSAGES[code])
    if 'cuda out of memory' in text or 'cuda error: out of memory' in text:
        return RecognitionError('cuda_memory', MESSAGES['cuda_memory'])
    if any(fragment in text for fragment in ('winerror 1455', 'paging file is too small',
            'openblas error: memory allocation', 'defaultcpuallocator: not enough memory')):
        return RecognitionError('host_memory', MESSAGES['host_memory'])
    return None
