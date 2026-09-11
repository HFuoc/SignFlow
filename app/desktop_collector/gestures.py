"""Gesture catalog validation shared with future capture workflows."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path


GESTURE_ID_PATTERN = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")


@dataclass(frozen=True, slots=True)
class GestureDefinition:
    id: str
    display_name: str
    active: bool = True


@dataclass(frozen=True, slots=True)
class GestureCatalog:
    schema_version: int
    gestures: tuple[GestureDefinition, ...]

    def by_id(self, gesture_id: str) -> GestureDefinition:
        for gesture in self.gestures:
            if gesture.id == gesture_id:
                return gesture
        raise KeyError(gesture_id)


def normalize_gesture_id(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.strip().lower())
    return normalized.strip("_")


def validate_catalog_data(data: object) -> GestureCatalog:
    if not isinstance(data, dict):
        raise ValueError("gesture catalog must be a JSON object")
    if data.get("schema_version") != 1:
        raise ValueError("unsupported gesture catalog schema_version")
    raw_gestures = data.get("gestures")
    if not isinstance(raw_gestures, list):
        raise ValueError("gestures must be an array")

    seen: set[str] = set()
    gestures: list[GestureDefinition] = []
    for index, item in enumerate(raw_gestures):
        if not isinstance(item, dict):
            raise ValueError(f"gesture at index {index} must be an object")
        gesture_id = item.get("id")
        display_name = item.get("display_name")
        active = item.get("active", True)
        if not isinstance(gesture_id, str) or not GESTURE_ID_PATTERN.fullmatch(gesture_id):
            raise ValueError(f"invalid gesture id at index {index}: {gesture_id!r}")
        if gesture_id in seen:
            raise ValueError(f"duplicate gesture id: {gesture_id}")
        if not isinstance(display_name, str) or not display_name.strip():
            raise ValueError(f"display_name is required for {gesture_id}")
        if not isinstance(active, bool):
            raise ValueError(f"active must be boolean for {gesture_id}")
        seen.add(gesture_id)
        gestures.append(GestureDefinition(gesture_id, display_name.strip(), active))
    return GestureCatalog(schema_version=1, gestures=tuple(gestures))


def load_gesture_catalog(path: str | Path) -> GestureCatalog:
    with Path(path).open("r", encoding="utf-8") as handle:
        return validate_catalog_data(json.load(handle))

