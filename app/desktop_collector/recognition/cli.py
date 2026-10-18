"""Internal offline verification CLI; annotation and prediction remain distinct."""
import argparse
from dataclasses import asdict
from pathlib import Path
import sys

from .contracts import MODEL, encode
from .registry import REGISTRY
from .service import RecognitionService
from .worker_client import WorkerConfig


def main() -> int:
    defaults = WorkerConfig()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample", required=True, help="kvsl:<topic>:<recording-stem>")
    parser.add_argument("--provider", default=MODEL.provider_id)
    parser.add_argument("--workspace", type=Path, default=defaults.workspace)
    for name in ("manifest", "upstream", "assets", "checkpoint", "python", "worker_module"):
        parser.add_argument("--" + name.replace("_", "-"), default=getattr(defaults, name))
    parser.add_argument("--timeout", type=float, default=defaults.timeout_s)
    args = parser.parse_args()
    config = WorkerConfig(workspace=args.workspace, timeout_s=args.timeout,
                          **{k: getattr(args, k) for k in ("manifest", "upstream", "assets", "checkpoint", "python", "worker_module")})
    with RecognitionService(config) as service:
        result = service.recognize(args.sample, args.provider)
    model = REGISTRY.get(args.provider)
    sys.stdout.buffer.write(encode({"annotation": result.source_provenance.get("annotation"),
                                   "prediction": result.to_dict(), "model_descriptor": asdict(model) if model else None}))
    return 0 if result.status == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())
