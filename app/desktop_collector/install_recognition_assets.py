"""Verify and install the bounded, bundled recognition assets without overwrites."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path


def install(root: Path) -> int:
    root = root.resolve()
    bundle = root / "configs/recognition-assets"
    manifest = json.loads((bundle / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("schema") != 1:
        raise ValueError("Unsupported recognition asset manifest")
    pending = []
    seen = set()
    for row in manifest["files"]:
        source = (bundle / row["file"]).resolve()
        target = (root / row["destination"]).resolve()
        if not source.is_relative_to(bundle) or not target.is_relative_to(root / ".design-cache"):
            raise ValueError("Asset path escapes installation directories")
        if target in seen:
            raise ValueError("Duplicate asset destination")
        seen.add(target)
        data = source.read_bytes()
        if len(data) != row["bytes"] or hashlib.sha256(data).hexdigest() != row["sha256"]:
            raise ValueError(f"Bundled asset failed verification: {row['file']}")
        if target.exists():
            if target.read_bytes() != data:
                raise ValueError(f"Preserving different existing asset: {row['destination']}")
        else:
            pending.append((target, data))
    # Preflight the entire bundle before any writes. Exclusive create protects
    # user files even if another process creates one after the check above.
    for target, data in pending:
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("xb") as stream:
            stream.write(data)
    return len(manifest["files"])


if __name__ == "__main__":
    count = install(Path(__file__).resolve().parents[2])
    print(f"Verified {count} recognition assets.")
