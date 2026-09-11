from __future__ import annotations

import pytest

from app.desktop_collector.domain import Hand, QualityFlag, SensorPacket


def packet(**overrides: object) -> SensorPacket:
    values: dict[str, object] = {
        "protocol_version": "sim-1",
        "device_id": "SIM-L",
        "boot_id": "boot-1",
        "hand": Hand.LEFT,
        "sequence_number": 0,
        "device_timestamp_ms": 0,
        "host_timestamp_ns": 1,
        "flex_raw": (1, 2, 3, 4, 5),
        "fsr_raw": 6,
        "accel_raw": (7, 8, 9),
        "gyro_raw": (10, 11, 12),
        "distance_mm": 13,
        "quality_flags": QualityFlag.SIMULATED,
        "simulated": True,
    }
    values.update(overrides)
    return SensorPacket(**values)  # type: ignore[arg-type]


def test_sensor_packet_accepts_complete_raw_sample() -> None:
    sample = packet()
    assert sample.hand is Hand.LEFT
    assert sample.flex_raw == (1, 2, 3, 4, 5)
    assert sample.simulated is True


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("device_id", "", "device_id"),
        ("sequence_number", -1, "sequence_number"),
        ("flex_raw", (1, 2), "five channels"),
        ("accel_raw", (1, 2), "three axes"),
    ],
)
def test_sensor_packet_rejects_invalid_shape(field: str, value: object, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        packet(**{field: value})


def test_simulated_packet_requires_quality_flag() -> None:
    with pytest.raises(ValueError, match="QualityFlag.SIMULATED"):
        packet(quality_flags=QualityFlag.NONE)

