from __future__ import annotations

from pathlib import Path

import pytest

from app.desktop_collector.gestures import (
    load_gesture_catalog,
    normalize_gesture_id,
    validate_catalog_data,
)


ROOT = Path(__file__).resolve().parents[1]


def test_repository_gesture_catalog_is_valid() -> None:
    catalog = load_gesture_catalog(ROOT / "configs" / "gestures.json")
    assert catalog.schema_version == 1
    assert catalog.by_id("open_hand").display_name == "Xòe bàn tay"


@pytest.mark.parametrize(
    ("source", "expected"),
    [("  Open Hand ", "open_hand"), ("Thumbs-up", "thumbs_up"), ("A  B", "a_b")],
)
def test_normalize_gesture_id(source: str, expected: str) -> None:
    assert normalize_gesture_id(source) == expected


def test_duplicate_gesture_ids_are_rejected() -> None:
    data = {
        "schema_version": 1,
        "gestures": [
            {"id": "open_hand", "display_name": "A", "active": True},
            {"id": "open_hand", "display_name": "B", "active": True},
        ],
    }
    with pytest.raises(ValueError, match="duplicate"):
        validate_catalog_data(data)


@pytest.mark.parametrize("gesture_id", ["", "Open_Hand", "open-hand", "1gesture", "open__hand"])
def test_invalid_gesture_ids_are_rejected(gesture_id: str) -> None:
    with pytest.raises(ValueError, match="invalid gesture id"):
        validate_catalog_data(
            {
                "schema_version": 1,
                "gestures": [{"id": gesture_id, "display_name": "Test", "active": True}],
            }
        )

