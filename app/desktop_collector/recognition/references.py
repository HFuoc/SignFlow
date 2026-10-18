"""Pinned local reference previews; no model execution or runtime transcoding."""
import hashlib
import json
from pathlib import Path

from .adapter import contained
from .contracts import RecognitionError, require
from .experimental import VISIGN_MODEL, classes
from .videomae import VIDEOMAE_MODEL
from .gh_tcn import GH_TCN_MODEL, classes as gh_classes
from .registry import get_model

REFERENCE_DIRECTORY = ".design-cache/visign-references-20261014-v2"
MANIFEST_SHA256 = "42de9f617d90f513d2bb2784ac5ba2ff0c810e4ec3028714bbdcc7782386db48"
REFERENCE_SCHEMA = "visign-reference-previews-v1"
MAX_MEDIA_BYTES = 4 * 1024 * 1024
MAX_MANIFEST_BYTES = 128 * 1024
GH_REFERENCE_DIRECTORY = ".design-cache/gh-landmark-references-20261018-v2"
GH_MANIFEST_SHA256 = "2288fd61f6656abc5338a37d9e9db2161589724d043845b84412e51408e5fd05"


def identities(model=VISIGN_MODEL):
    gh = model == GH_TCN_MODEL
    return [{"reference_id": f"{'gh25' if gh else 'visign25'}-{item['class_index']:02d}",
             "label_id": item["label_id"], "display_name": item["label"],
             **({"kind": "landmark_replay"} if gh else {}),
             "source_semantics_verified": False, "media_type": "video/webm"}
            for item in (gh_classes() if gh else classes())]


def bounded_bytes(path, limit):
    """Read once with a hard allocation limit, including files changed during read."""
    with Path(path).open("rb") as stream:
        data = stream.read(limit + 1)
    require(0 < len(data) <= limit, "reference_unavailable", "Invalid reference size")
    return data


class ReferenceCatalog:
    def __init__(self, workspace):
        self.workspace = Path(workspace).resolve()

    def _root(self, model=VISIGN_MODEL):
        return contained(self.workspace, GH_REFERENCE_DIRECTORY if model == GH_TCN_MODEL else REFERENCE_DIRECTORY)

    def _manifest(self, model=VISIGN_MODEL):
        gh = model == GH_TCN_MODEL
        raw = bounded_bytes(contained(self._root(model), "manifest.json"), MAX_MANIFEST_BYTES)
        require(hashlib.sha256(raw).hexdigest() == (GH_MANIFEST_SHA256 if gh else MANIFEST_SHA256),
                "reference_unavailable", "Reference manifest identity differs")
        value = json.loads(raw)
        require(value["schema_version"] == ("gh-landmark-replays-v1" if gh else REFERENCE_SCHEMA) and
                value["provider_id"] == model.provider_id and
                value["source_semantics_verified"] is False,
                "reference_unavailable", "Invalid reference manifest")
        rows = value["references"]
        require(isinstance(rows, list) and len(rows) == len(identities(model)),
                "reference_unavailable", "Reference vocabulary differs")
        for row, expected in zip(rows, identities(model), strict=True):
            require(all(row[key] == value for key, value in expected.items()) and
                    row["filename"] == expected["reference_id"] + ".webm" and
                    type(row["bytes"]) is int and 0 < row["bytes"] <= MAX_MEDIA_BYTES and
                    isinstance(row["sha256"], str) and len(row["sha256"]) == 64,
                    "reference_unavailable", "Reference identity differs")
        return rows

    def _media(self, row, model=VISIGN_MODEL):
        data = bounded_bytes(contained(self._root(model), row["filename"]), MAX_MEDIA_BYTES)
        require(len(data) == row["bytes"] and data.startswith(b"\x1a\x45\xdf\xa3") and
                hashlib.sha256(data).hexdigest() == row["sha256"],
                "reference_unavailable", "Reference media identity differs")
        return data

    def list(self, provider_id):
        model = get_model(provider_id)
        if model not in (VISIGN_MODEL, VIDEOMAE_MODEL, GH_TCN_MODEL):
            return []
        if model == VIDEOMAE_MODEL:
            model = VISIGN_MODEL
        entries = [{**item, "available": False} for item in identities(model)]
        try:
            rows = self._manifest(model)
        except (OSError, ValueError, TypeError, KeyError):
            return entries
        for entry, row in zip(entries, rows, strict=True):
            try:
                self._media(row, model)
                entry["available"] = True
            except (OSError, ValueError, TypeError, KeyError):
                pass
        return entries

    def media(self, reference_id):
        model = GH_TCN_MODEL if reference_id in [r["reference_id"] for r in identities(GH_TCN_MODEL)] else VISIGN_MODEL
        ids = [entry["reference_id"] for entry in identities(model)]
        require(reference_id in ids, "unknown_reference", "Unknown reference identity")
        try:
            return self._media(self._manifest(model)[ids.index(reference_id)], model)
        except (OSError, ValueError, TypeError, KeyError):
            raise RecognitionError("reference_unavailable", "Reference media is unavailable") from None
