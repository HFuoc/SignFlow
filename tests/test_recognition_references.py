"""Reference media allowlist, integrity, bounded delivery and existing authentication."""
from dataclasses import replace
import hashlib
import json
from pathlib import Path

import pytest
from starlette.testclient import TestClient

from app.desktop_collector.recognition import references
from app.desktop_collector.recognition.contracts import MODEL, RecognitionError
from app.desktop_collector.recognition.experimental import VISIGN_MODEL, WORDS
from app.desktop_collector.server import create_app
from app.desktop_collector.vsl_reference_media import select_exemplars

ORIGIN = "http://127.0.0.1:43123"
HEADERS = {"Origin": ORIGIN, "Authorization": "Bearer reference-test-only"}
PASSWORD = "Reference test password only"
BASE = "/api/v1/recognition/references"
CATALOG = BASE + "?provider_id=" + VISIGN_MODEL.provider_id
MEDIA = BASE + "/visign25-00/media"


@pytest.fixture
def prepared(tmp_path, monkeypatch):
    root = tmp_path / references.REFERENCE_DIRECTORY
    root.mkdir(parents=True)
    rows = []
    for index, identity in enumerate(references.identities()):
        raw = b"\x1a\x45\xdf\xa3synthetic-media-" + bytes([index])
        filename = identity["reference_id"] + ".webm"
        (root / filename).write_bytes(raw)
        rows.append({**identity, "filename": filename, "bytes": len(raw),
                     "sha256": hashlib.sha256(raw).hexdigest()})
    value = {"schema_version": references.REFERENCE_SCHEMA, "provider_id": VISIGN_MODEL.provider_id,
             "source_semantics_verified": False, "references": rows}
    def publish():
        raw = json.dumps(value, ensure_ascii=False).encode("utf8")
        (root / "manifest.json").write_bytes(raw)
        monkeypatch.setattr(references, "MANIFEST_SHA256", hashlib.sha256(raw).hexdigest())
    publish()
    return references.ReferenceCatalog(tmp_path), root, value, publish


def test_vocabulary_and_media_are_canonical_without_local_paths(prepared):
    catalog, root, _, _ = prepared
    rows = catalog.list(VISIGN_MODEL.provider_id)
    assert [row["display_name"] for row in rows] == list(WORDS)
    assert [row["label_id"] for row in rows] == [f"visign:visign25:{i}" for i in range(25)]
    assert all(row["available"] and row["source_semantics_verified"] is False for row in rows)
    assert str(root) not in json.dumps(rows)
    assert "filename" not in rows[0] and "sha256" not in rows[0]
    assert catalog.media(rows[0]["reference_id"]) == (root / "visign25-00.webm").read_bytes()
    assert catalog.list(MODEL.provider_id) == []
    with pytest.raises(RecognitionError):
        catalog.list("unregistered-provider")


@pytest.mark.parametrize("identity", ["../secret", "..\\secret", "C:/secret", "visign25-25",
                                     "visign25-0", "visign25-00.webm", "", "visign25-00?path=secret"])
def test_only_exact_reference_ids_are_accepted(prepared, identity):
    catalog, _, _, _ = prepared
    with pytest.raises(RecognitionError) as error:
        catalog.media(identity)
    assert error.value.code == "unknown_reference"


@pytest.mark.parametrize("condition", ["missing", "corrupt", "oversized", "directory"])
def test_missing_or_replaced_media_is_unavailable_without_breaking_other_entries(prepared, condition):
    catalog, root, _, _ = prepared
    path = root / "visign25-00.webm"
    assert catalog.list(VISIGN_MODEL.provider_id)[0]["available"]
    if condition == "missing":
        path.unlink()
    elif condition == "corrupt":
        path.write_bytes(b"different bytes")
    elif condition == "oversized":
        path.write_bytes(b"\x1a\x45\xdf\xa3" + b"x" * references.MAX_MEDIA_BYTES)
    else:
        path.unlink()
        path.mkdir()
    listing = catalog.list(VISIGN_MODEL.provider_id)
    assert listing[0]["available"] is False
    assert all(row["available"] for row in listing[1:])
    with pytest.raises(RecognitionError) as error:
        catalog.media("visign25-00")
    assert error.value.code == "reference_unavailable"


@pytest.mark.parametrize("condition", ["missing", "tampered", "oversized"])
def test_manifest_identity_is_pinned_and_bounded(prepared, condition):
    catalog, root, _, _ = prepared
    path = root / "manifest.json"
    if condition == "missing":
        path.unlink()
    elif condition == "tampered":
        path.write_bytes(path.read_bytes() + b" ")
    else:
        path.write_bytes(b"x" * (references.MAX_MANIFEST_BYTES + 1))
    assert not any(row["available"] for row in catalog.list(VISIGN_MODEL.provider_id))
    with pytest.raises(RecognitionError, match="unavailable"):
        catalog.media("visign25-00")


@pytest.mark.parametrize("change", ["order", "count", "label", "semantics", "path", "absolute", "provider"])
def test_manifest_shape_and_identity_checked_in_addition_to_digest(prepared, change):
    catalog, _, value, publish = prepared
    row = value["references"][0]
    if change == "order": value["references"].reverse()
    elif change == "count": value["references"].pop()
    elif change == "label": row["display_name"] = "different word"
    elif change == "semantics": value["source_semantics_verified"] = True
    elif change == "path": row["filename"] = "../secret.webm"
    elif change == "absolute": row["filename"] = "C:/secret.webm"
    else: value["provider_id"] = MODEL.provider_id
    publish()  # Intentionally re-pin fixture to exercise shape checks.
    assert not any(row["available"] for row in catalog.list(VISIGN_MODEL.provider_id))
    with pytest.raises(RecognitionError): catalog.media("visign25-00")


def test_resolved_media_path_must_stay_inside_preview_directory(prepared, monkeypatch):
    catalog, root, _, _ = prepared
    original = Path.resolve
    def redirected(path, *args, **kwargs):
        if path.name == "visign25-00.webm":
            return root.parent / "outside.webm"
        return original(path, *args, **kwargs)
    monkeypatch.setattr(Path, "resolve", redirected)
    with pytest.raises(RecognitionError): catalog.media("visign25-00")
    assert not catalog.list(VISIGN_MODEL.provider_id)[0]["available"]


@pytest.fixture
def client(prepared, tmp_path):
    app = create_app(session_token="reference-test-only", port=43123,
                     allowed_origins=(ORIGIN,), database_path=tmp_path / "identity.sqlite3")
    service = app.state.runtime.recognition.service
    service.config = replace(service.config, workspace=tmp_path)
    with TestClient(app, base_url=ORIGIN) as client:
        for path in (CATALOG, MEDIA):
            assert client.get(path, headers=HEADERS).status_code == 401
        assert client.post("/api/v1/auth/setup", headers=HEADERS, json={
            "username": "admin", "password": PASSWORD, "password_confirmation": PASSWORD}).status_code == 201
        yield client


def test_api_serves_verified_bytes_and_no_store(client, prepared):
    _, root, _, _ = prepared
    response = client.get(CATALOG, headers=HEADERS)
    assert response.status_code == 200 and len(response.json()["references"]) == 25
    media = client.get(MEDIA, headers=HEADERS)
    assert media.status_code == 200 and media.content == (root / "visign25-00.webm").read_bytes()
    assert media.headers["content-type"] == "video/webm"
    assert media.headers["cache-control"] == "no-store"
    assert media.headers["x-content-type-options"] == "nosniff"
    (root / "visign25-00.webm").unlink()
    missing = client.get(MEDIA, headers=HEADERS)
    assert missing.status_code == 503 and missing.json()["code"] == "reference_unavailable"
    assert str(root) not in missing.text
    assert client.get(BASE + "/unregistered/media", headers=HEADERS).status_code == 404
    assert client.get(BASE + "?provider_id=" + MODEL.provider_id, headers=HEADERS).json() == {"references": []}


@pytest.mark.parametrize("path", [CATALOG, MEDIA])
def test_api_retains_bridge_cookie_host_origin_boundary(client, path):
    assert client.get(path).status_code == 401
    assert client.get(path, headers={**HEADERS, "Authorization": "Bearer wrong"}).status_code == 401
    assert client.get(path, headers={**HEADERS, "Host": "localhost:43123"}).status_code == 400
    assert client.get(path, headers={**HEADERS, "Host": "127.0.0.1:43124"}).status_code == 400
    assert client.get(path, headers={**HEADERS, "Origin": "http://evil.invalid"}).status_code == 403
    assert client.get(path, headers={**HEADERS, "Origin": ORIGIN + "/"}).status_code == 403
    client.cookies.clear()
    assert client.get(path, headers=HEADERS).status_code == 401


@pytest.mark.parametrize("path", [BASE, CATALOG + "&path=secret", CATALOG + "&provider_id=visign-ridge-25",
                                  MEDIA + "?token=forbidden", MEDIA + "?path=secret"])
def test_api_accepts_no_media_queries_or_additional_catalog_fields(client, path):
    assert client.get(path, headers=HEADERS).status_code == 422


def test_participants_cannot_read_reference_media(client):
    assert client.post("/api/v1/admin/users", headers=HEADERS, json={
        "username": "participant", "password": PASSWORD, "role": "participant"}).status_code == 201
    assert client.post("/api/v1/auth/logout", headers=HEADERS).status_code == 200
    assert client.post("/api/v1/auth/login", headers=HEADERS, json={
        "username": "participant", "password": PASSWORD}).status_code == 200
    for path in (CATALOG, MEDIA):
        assert client.get(path, headers=HEADERS).status_code == 403
    assert client.post("/api/v1/auth/change-password", headers=HEADERS, json={
        "current_password": PASSWORD, "new_password": PASSWORD + " updated",
        "new_password_confirmation": PASSWORD + " updated"}).status_code == 200
    for path in (CATALOG, MEDIA):
        assert client.get(path, headers=HEADERS).status_code == 403


def curation_fixture():
    rows = []
    for i, word in enumerate(WORDS):
        for prefix, split, status in [("0", "test", "screened_pending_semantics"),
                                      ("1", None, "quarantine"),
                                      ("2", "train", "screened_pending_semantics"),
                                      ("3", "train", "screened_pending_semantics")]:
            sha = prefix + f"{i:063x}"
            rows.append({"label": word, "sha256": sha, "local_file": "videos/" + sha + ".mp4",
                         "group_id": "group-" + sha,
                         "status": status, "proposed_split": split, "semantic_review": "pending",
                         "quality_flags": [], "flat_frame_indices": []})
    return {"schema_version": "visign-curation-review-v1", "semantic_review": "pending", "records": rows}


def split_fixture(curation):
    return {"schema_version": "visign-research-split-v1", "source_semantics_verified": False,
            "records": [{**row, "split": row["proposed_split"]} for row in curation["records"]]}


def test_offline_selection_uses_only_screened_train_sources_and_is_order_independent():
    value = curation_fixture()
    split = split_fixture(value)
    expected = select_exemplars(value, split)
    assert len(expected) == 25 and [row["label"] for row in expected] == list(WORDS)
    assert all(row["sha256"].startswith("2") for row in expected)
    value["records"].reverse()
    assert select_exemplars(value, split) == expected


def test_offline_selection_uses_final_split_after_train_to_validation_repair():
    value = curation_fixture()
    split = split_fixture(value)
    moved = next(row for row in split["records"] if row["label"] == WORDS[0] and row["sha256"].startswith("2"))
    moved["split"] = "val"
    chosen = select_exemplars(value, split)
    assert chosen[0]["sha256"].startswith("3")
    assert all(row["sha256"] != moved["sha256"] for row in chosen)


@pytest.mark.parametrize("change", ["missing", "path", "flag", "hash"])
def test_offline_selection_rejects_incomplete_or_unsafe_sources(change):
    value = curation_fixture()
    rows = [row for row in value["records"] if row["label"] == WORDS[0] and row["proposed_split"] == "train"]
    for row in rows:
        if change == "missing": row["proposed_split"] = "val"
        elif change == "path": row["local_file"] = "../secret.mp4"
        elif change == "flag": row["quality_flags"] = ["flat_frames"]
        else: row["sha256"] = "invalid"
    with pytest.raises(RecognitionError): select_exemplars(value, split_fixture(value))
