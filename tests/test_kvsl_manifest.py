"""Metadata-only fixtures; video bytes below are deliberately not decodable media."""

import csv
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import pytest

from app.desktop_collector import kvsl_manifest as kvsl


def git(repository, *args):
    return subprocess.check_output(
        ["git", "-C", str(repository), "-c", "user.name=Importer Test",
         "-c", "user.email=importer@example.invalid", "-c", "commit.gpgsign=false", *args],
        stderr=subprocess.PIPE,
    ).decode().strip()


@pytest.fixture
def upstream(tmp_path):
    repository = tmp_path / "upstream"
    repository.mkdir()
    git(repository, "init", "--quiet")
    model = repository / kvsl.MODEL_ROOT
    (model / "Videos").mkdir(parents=True)
    rows = [
        ["0", "Đồ vật", "cày", "1", "https://example.invalid/a", "W01.mp4", "do_vat"],
        ["1", "Đồ vật", "cày", "2", "https://example.invalid/b", "W01.mp4", "do_vat"],
        ["2", "Khác", "cày", "1", "https://example.invalid/a", "W01.mp4", "khac"],
        ["3", "Đồ vật", "bát", "1", "https://example.invalid/c", "W02.mp4", "do_vat"],
    ]
    with (model / "data.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(kvsl.COLUMNS)
        writer.writerows(rows)
    (model / "do_vat.json").write_text(json.dumps({"bát": 0, "cày": 1}, ensure_ascii=False), encoding="utf-8")
    (model / "khac.json").write_text(json.dumps({"cày": 0}, ensure_ascii=False), encoding="utf-8")
    for name in ("W01.mp4", "W02.mp4", "unreferenced.mp4"):
        (model / "Videos" / name).write_bytes(b"synthetic fixture " + name.encode())
    git(repository, "add", ".")
    git(repository, "commit", "--quiet", "-m", "Synthetic metadata fixture")
    revision = git(repository, "rev-parse", "HEAD")
    return repository, revision


def build(upstream):
    repository, revision = upstream
    return kvsl.build_manifest(repository, source_commit=revision, artifact_commit=revision)


def recommit(repository):
    git(repository, "add", "-A")
    git(repository, "commit", "--quiet", "-m", "Fixture mutation")
    return repository, git(repository, "rev-parse", "HEAD")


def mutate_rows(upstream, transform):
    repository, _ = upstream
    path = repository / kvsl.CSV_PATH
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.reader(handle))
    transform(rows)
    with path.open("w", encoding="utf-8", newline="") as handle:
        csv.writer(handle).writerows(rows)
    return recommit(repository)


def test_provenance_deduplication_and_topic_local_indices(upstream):
    manifest = build(upstream)
    counts = manifest["diagnostics"]
    assert counts["csv_rows"] == 4
    assert counts["recordings"] == 2
    assert counts["annotations"] == 3
    assert counts["duplicate_annotation_rows"] == 1
    assert counts["duplicate_rows"][0]["record_numbers"] == [1, 2]
    assert counts["unreferenced_video_paths"] == [kvsl.VIDEO_ROOT + "unreferenced.mp4"]
    record = manifest["recordings"][0]
    assert record["recording_id"] == "kvsl:W01"
    assert [a["label_id"] for a in record["annotations"]] == ["kvsl:do_vat:1", "kvsl:khac:0"]
    assert [r["LEVEL"] for r in record["annotations"][0]["source_rows"]] == ["1", "2"]
    assert record["asset"]["sha256"] == hashlib.sha256(b"synthetic fixture W01.mp4").hexdigest()
    assert record["asset"]["git_blob"] == git(upstream[0], "rev-parse", upstream[1] + ":" + kvsl.VIDEO_ROOT + "W01.mp4")
    assert record["asset"]["commit"] == upstream[1]
    assert record["split"] is record["signer_id"] is record["session_id"] is None
    assert record["training_overlap"] == record["license"] == "unknown"
    assert record["media_validation"] == "not_performed"
    assert record["modality"] == "video" and record["simulated"] is False


def test_uses_pinned_objects_despite_dirty_worktree_and_new_head(upstream):
    expected = build(upstream)
    repository, _ = upstream
    (repository / kvsl.CSV_PATH).write_text("not CSV", encoding="utf-8")
    (repository / kvsl.VIDEO_ROOT / "W01.mp4").write_bytes(b"changed")
    recommit(repository)
    (repository / kvsl.MODEL_ROOT / "do_vat.json").write_text("{}", encoding="utf-8")
    assert build(upstream) == expected


def test_missing_video_is_explicit_without_invented_hash(upstream):
    (upstream[0] / kvsl.VIDEO_ROOT / "W01.mp4").unlink()
    manifest = build(recommit(upstream[0]))
    record = manifest["recordings"][0]
    assert record["asset_status"] == "missing_at_artifact_commit"
    assert record["asset"]["sha256"] is record["asset"]["bytes"] is None
    assert manifest["diagnostics"]["missing_recordings"] == ["kvsl:W01"]


def test_identical_content_is_flagged_without_inventing_recording_identity(upstream):
    folder = upstream[0] / kvsl.VIDEO_ROOT
    (folder / "W02.mp4").write_bytes((folder / "W01.mp4").read_bytes())
    manifest = build(recommit(upstream[0]))
    assert manifest["diagnostics"]["identical_content_groups"] == [["kvsl:W01", "kvsl:W02"]]
    assert len(manifest["recordings"]) == 2


@pytest.mark.parametrize("column,value,message", [
    ("VIDEO", "../W01.mp4", "Unsafe video"),
    ("VIDEO", "C:\\W01.mp4", "Unsafe video"),
    ("topic_id", "../do_vat", "Unsafe topic"),
    ("LABEL", "unknown label", "absent from topic map"),
    ("TOPIC", "Different topic name", "Conflicting topic"),
    ("LABEL", "bát", "Conflicting labels"),
    ("ID", "0", "duplicate CSV ID"),
    ("LEVEL", "0", "Invalid LEVEL"),
    ("VIDEO_URL", "", "Incomplete CSV"),
])
def test_invalid_rows_fail_instead_of_silent_relabeling(upstream, column, value, message):
    modified = mutate_rows(upstream, lambda rows: rows[2].__setitem__(kvsl.COLUMNS.index(column), value))
    with pytest.raises(kvsl.ManifestError, match=message):
        build(modified)


@pytest.mark.parametrize("contents", [
    '{"cày":0,"cày":1}', '{"bát":0,"cày":0}',
    '{"bát":0,"cày":2}', '{"bát":false,"cày":1}', "[]", "{}", "broken JSON",
])
def test_invalid_maps_fail(upstream, contents):
    (upstream[0] / kvsl.MODEL_ROOT / "do_vat.json").write_text(contents, encoding="utf-8")
    with pytest.raises(kvsl.ManifestError):
        build(recommit(upstream[0]))


def test_missing_map_fails(upstream):
    (upstream[0] / kvsl.MODEL_ROOT / "do_vat.json").unlink()
    with pytest.raises(kvsl.ManifestError, match="Missing required metadata"):
        build(recommit(upstream[0]))


def test_metadata_and_artifacts_can_come_from_different_commits(upstream):
    repository, artifact_revision = upstream
    (repository / kvsl.VIDEO_ROOT / "W01.mp4").unlink()
    _, source_revision = recommit(repository)
    manifest = kvsl.build_manifest(
        repository, source_commit=source_revision, artifact_commit=artifact_revision,
    )
    assert manifest["source"]["csv"]["commit"] == source_revision
    assert manifest["recordings"][0]["asset"]["commit"] == artifact_revision
    assert manifest["diagnostics"]["missing_recordings"] == []


@pytest.mark.parametrize("contents", [
    "wrong,header\n1,2\n", ",".join(kvsl.COLUMNS) + "\n",
    ",".join(kvsl.COLUMNS) + "\n0,incomplete\n",
])
def test_malformed_or_empty_csv_fails(upstream, contents):
    (upstream[0] / kvsl.CSV_PATH).write_text(contents, encoding="utf-8")
    with pytest.raises(kvsl.ManifestError):
        build(recommit(upstream[0]))


@pytest.mark.parametrize("revision", ["HEAD", "-invalid", "a" * 40])
def test_unavailable_or_unpinned_revision_fails(upstream, revision):
    with pytest.raises(kvsl.ManifestError):
        kvsl.build_manifest(upstream[0], source_commit=revision, artifact_commit=upstream[1])


def test_output_roundtrip_idempotent_and_never_overwrites(tmp_path, upstream):
    destination = tmp_path / "output" / "manifest.json"
    manifest = build(upstream)
    assert kvsl.write_manifest(manifest, destination) == "created"
    original = destination.read_bytes()
    timestamp = destination.stat().st_mtime_ns
    assert json.loads(original) == manifest
    assert "cày" in original.decode()
    assert kvsl.write_manifest(build(upstream), destination) == "unchanged"
    assert destination.stat().st_mtime_ns == timestamp
    with pytest.raises(kvsl.ManifestError, match="no overwrite"):
        kvsl.write_manifest({"different": True}, destination)
    assert destination.read_bytes() == original
    assert not list(destination.parent.glob("*.part"))


def test_publication_failure_leaves_no_partial_manifest(tmp_path, monkeypatch):
    def fail(*args):
        raise OSError("test filesystem failure")
    monkeypatch.setattr(kvsl.os, "link", fail)
    with pytest.raises(OSError, match="test filesystem"):
        kvsl.write_manifest({"valid": "payload"}, tmp_path / "manifest.json")
    assert list(tmp_path.iterdir()) == []


def test_concurrent_output_is_not_overwritten(tmp_path, monkeypatch):
    destination = tmp_path / "manifest.json"
    def race(*args):
        destination.write_bytes(b"other writer")
        raise FileExistsError()
    monkeypatch.setattr(kvsl.os, "link", race)
    with pytest.raises(kvsl.ManifestError, match="changed during import"):
        kvsl.write_manifest({"valid": "payload"}, destination)
    assert destination.read_bytes() == b"other writer"
    assert list(tmp_path.iterdir()) == [destination]


def test_raw_and_upstream_output_protected(tmp_path, upstream):
    with pytest.raises(kvsl.ManifestError, match="data/raw"):
        kvsl.write_manifest({}, tmp_path / "data" / "raw" / "session" / "manifest.json")
    with pytest.raises(SystemExit) as failure:
        kvsl.main(["--repository", str(upstream[0]), "--output", str(upstream[0] / "manifest.json")])
    assert failure.value.code == 2


def test_cli_in_fresh_process_has_no_ml_or_ui_imports():
    code = "from app.desktop_collector import kvsl_manifest; import sys; assert not {'torch','mediapipe','numpy','PySide6','fastapi','webview'} & set(sys.modules)"
    subprocess.run([sys.executable, "-c", code], check=True)
