from __future__ import annotations

import base64
import io
import sqlite3

import pytest
from PIL import Image, PngImagePlugin
from starlette.testclient import TestClient

from app.desktop_collector.auth import AuthService, AuthenticationError
from app.desktop_collector.persistence import IdentityRepository, MIGRATIONS, PersistenceStartupError
from app.desktop_collector.server import create_app

ORIGIN = "http://127.0.0.1:43125"
HEADERS = {"Origin": ORIGIN, "Authorization": "Bearer profile-test-bridge"}
PASSWORD = "profile test password only"
PROFILE = {"display_name": "New display", "full_name": "Nguyễn Văn An",
           "contact_email": "an@example.test", "organization": "Research team", "avatar_data_url": None}


def png_avatar():
    output = io.BytesIO()
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("private", "Must not persist")
    Image.new("RGB", (80, 120), "blue").save(output, format="PNG", pnginfo=metadata)
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode()


def test_avatar_is_decoded_cropped_and_metadata_removed():
    result = AuthService.normalize_avatar(png_avatar())
    with Image.open(io.BytesIO(base64.b64decode(result.split(",")[1]))) as image:
        assert image.size == (256, 256)
        assert image.format == "PNG"
        assert not image.info
    assert AuthService.normalize_avatar(None) is None


def test_avatar_rejects_animation_and_oversized_dimensions():
    for images in [[Image.new("RGB", (4097, 1))], [Image.new("RGB", (4, 4), "red"), Image.new("RGB", (4, 4), "blue")]]:
        output = io.BytesIO()
        images[0].save(output, format="PNG", save_all=True, append_images=images[1:])
        with pytest.raises(AuthenticationError):
            AuthService.normalize_avatar("data:image/png;base64," + base64.b64encode(output.getvalue()).decode())


def test_jpeg_avatar_orientation_is_applied_without_retaining_exif():
    output = io.BytesIO()
    image = Image.new("RGB", (60, 80), "red")
    exif = Image.Exif(); exif[274] = 6; exif[315] = "Private author"
    image.save(output, format="JPEG", exif=exif)
    result = AuthService.normalize_avatar("data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode())
    with Image.open(io.BytesIO(base64.b64decode(result.split(",")[1]))) as normalized:
        assert normalized.size == (256, 256) and not normalized.getexif()


@pytest.mark.parametrize("value", ["https://example.test/avatar.png", "data:image/svg+xml;base64,PHN2Zz4=",
                                  "data:image/png;base64,YmFk", "data:image/jpeg;base64,!!!!", "x" * 2_800_001],
                         ids=["remote", "svg", "corrupt", "base64", "too-large"])
def test_avatar_rejects_unsupported_or_invalid_data(value):
    with pytest.raises(AuthenticationError, match="PNG"):
        AuthService.normalize_avatar(value)


@pytest.mark.parametrize("role", ["participant", "researcher", "administrator", "developer"])
def test_profile_is_self_only_persistent_and_does_not_change_permissions(tmp_path, role):
    database = tmp_path / "identity.sqlite3"
    app = create_app(session_token="profile-test-bridge", port=43125,
                     allowed_origins=(ORIGIN,), database_path=database)
    with TestClient(app, base_url=ORIGIN) as client:
        assert client.put("/api/v1/auth/profile", headers=HEADERS, json=PROFILE).status_code == 401
        admin = client.post("/api/v1/auth/setup", headers=HEADERS, json={
            "username": "admin", "password": PASSWORD, "password_confirmation": PASSWORD}).json()["user"]
        if role != "administrator":
            assert client.post("/api/v1/admin/users", headers=HEADERS, json={
                "username": "subject", "password": PASSWORD, "role": role}).status_code == 201
            client.post("/api/v1/auth/logout", headers=HEADERS)
            client.post("/api/v1/auth/login", headers=HEADERS, json={"username": "subject", "password": PASSWORD})
            assert client.put("/api/v1/auth/profile", headers=HEADERS, json=PROFILE).status_code == 403
            assert client.post("/api/v1/auth/change-password", headers=HEADERS, json={
                "current_password": PASSWORD, "new_password": PASSWORD + " new",
                "new_password_confirmation": PASSWORD + " new"}).status_code == 200
        cookie = client.cookies.get("smartglove_user_session")
        assert client.put("/api/v1/auth/profile", headers={**HEADERS, "Origin": "http://evil.test"}, json=PROFILE).status_code == 403
        assert client.put("/api/v1/auth/profile", headers=HEADERS, json={**PROFILE, "role": "administrator"}).status_code == 422
        assert client.put("/api/v1/auth/profile", headers=HEADERS, json={**PROFILE, "id": admin["id"]}).status_code == 422
        assert client.put("/api/v1/auth/profile", headers=HEADERS, json={**PROFILE, "contact_email": "invalid"}).status_code == 400
        response = client.put("/api/v1/auth/profile", headers=HEADERS, json={**PROFILE, "avatar_data_url": png_avatar()})
        assert response.status_code == 200
        user = response.json()["user"]
        assert user["role"] == role
        assert user["full_name"] == PROFILE["full_name"]
        assert client.cookies.get("smartglove_user_session") == cookie
        assert client.get("/api/v1/auth/status", headers=HEADERS).json()["user"] == user
        assert client.get("/api/v1/bootstrap", headers=HEADERS).status_code == (403 if role == "participant" else 200)
        assert client.get("/api/v1/admin/users", headers=HEADERS).status_code == (200 if role == "administrator" else 403)
        assert client.put("/api/v1/auth/profile", headers=HEADERS, json=PROFILE).json()["user"]["avatar_data_url"] is None
    repository = IdentityRepository(database)
    try:
        assert repository.get_user(user["id"]).organization == PROFILE["organization"]
        updates = [event for event in repository.list_audit_events() if event.event_type == "profile_updated"]
        assert len(updates) == 2 and all(not event.metadata for event in updates)
        if role != "administrator":
            assert repository.get_user(admin["id"]).full_name is None
    finally:
        repository.close()


def create_v1(path):
    with sqlite3.connect(path) as connection:
        connection.execute("CREATE TABLE schema_versions(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)")
        for statement in MIGRATIONS[1]:
            connection.execute(statement)
        connection.execute("INSERT INTO schema_versions VALUES(1, 'before')")
        connection.execute("INSERT INTO users(id,username,password_hash,role,created_at,updated_at) VALUES('owner','owner','existing hash','administrator','before','before')")
        connection.execute("INSERT INTO user_sessions(id,token_hash,user_id,credential_version,created_at,last_seen_at,absolute_expires_at,idle_expires_at) VALUES('session','hash','owner',1,'before','before','later','later')")


def test_v1_upgrade_keeps_identity_and_creates_recoverable_backup(tmp_path):
    path = tmp_path / "old.sqlite3"
    create_v1(path)
    repository = IdentityRepository(path)
    try:
        assert repository.schema_versions() == (1, 2)
        assert repository.get_user("owner").password_hash == "existing hash"
        assert repository.get_user("owner").full_name is None
        assert repository.active_session_ids("owner") == ("session",)
        repository.migrate()
    finally:
        repository.close()
    backups = list(tmp_path.glob("*.pre-profile-v1-*.sqlite3"))
    assert len(backups) == 1
    with sqlite3.connect(backups[0]) as backup:
        assert backup.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert backup.execute("SELECT version FROM schema_versions").fetchall() == [(1,)]
        assert backup.execute("SELECT username FROM users").fetchone()[0] == "owner"


def test_failed_profile_migration_rolls_back(tmp_path, monkeypatch):
    path = tmp_path / "old.sqlite3"
    create_v1(path)
    monkeypatch.setitem(MIGRATIONS, 2, (*MIGRATIONS[2], "INVALID SQL"))
    with pytest.raises(PersistenceStartupError):
        IdentityRepository(path)
    with sqlite3.connect(path) as connection:
        assert connection.execute("SELECT version FROM schema_versions").fetchall() == [(1,)]
        assert "full_name" not in [row[1] for row in connection.execute("PRAGMA table_info(users)")]
