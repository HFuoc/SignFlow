import hashlib
import json

import pytest

from app.desktop_collector.install_recognition_assets import install


def bundle(root, destination=".design-cache/model.bin"):
    directory = root / "configs/recognition-assets"
    directory.mkdir(parents=True)
    (directory / "model.bin").write_bytes(b"frozen")
    (directory / "manifest.json").write_text(json.dumps({"schema": 1, "files": [{
        "file": "model.bin", "destination": destination, "bytes": 6,
        "sha256": hashlib.sha256(b"frozen").hexdigest(),
    }]}))
    return directory


def test_install_and_repeat_preserve_asset(tmp_path):
    bundle(tmp_path)
    assert install(tmp_path) == 1
    target = tmp_path / ".design-cache/model.bin"
    before = target.stat().st_mtime_ns
    assert install(tmp_path) == 1
    assert target.read_bytes() == b"frozen"
    assert target.stat().st_mtime_ns == before


def test_conflicting_local_asset_is_not_overwritten(tmp_path):
    bundle(tmp_path)
    target = tmp_path / ".design-cache/model.bin"
    target.parent.mkdir()
    target.write_bytes(b"user work")
    with pytest.raises(ValueError, match="Preserving"):
        install(tmp_path)
    assert target.read_bytes() == b"user work"


def test_corrupt_bundle_is_not_installed(tmp_path):
    directory = bundle(tmp_path)
    (directory / "model.bin").write_bytes(b"broken")
    with pytest.raises(ValueError, match="verification"):
        install(tmp_path)
    assert not (tmp_path / ".design-cache").exists()


def test_destination_cannot_escape(tmp_path):
    bundle(tmp_path, "../model.bin")
    with pytest.raises(ValueError, match="escapes"):
        install(tmp_path)
