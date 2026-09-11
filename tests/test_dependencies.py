from pathlib import Path


def test_project_does_not_include_machine_learning_frameworks() -> None:
    manifest = (Path(__file__).resolve().parents[1] / "pyproject.toml").read_text(encoding="utf-8").lower()
    assert "torch" not in manifest
    assert "tensorflow" not in manifest

