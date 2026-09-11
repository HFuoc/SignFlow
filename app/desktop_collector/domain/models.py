"""Core domain models for acquisition without UI dependencies."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, IntFlag
from typing import Mapping


class Hand(str, Enum):
    LEFT = "left"
    RIGHT = "right"

    @property
    def short_label(self) -> str:
        return "L" if self is Hand.LEFT else "R"

    @property
    def display_name(self) -> str:
        return "Tay trái" if self is Hand.LEFT else "Tay phải"


class ConnectionState(str, Enum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"


class SignalStatus(str, Enum):
    GOOD = "good"
    NOISY = "noisy"
    MISSING = "missing"


class QualityFlag(IntFlag):
    NONE = 0
    SIMULATED = 1 << 0
    PACKET_GAP = 1 << 1
    SENSOR_MISSING = 1 << 2


@dataclass(frozen=True, slots=True)
class DeviceCapabilities:
    flex_channels: tuple[bool, bool, bool, bool, bool]
    fsr: bool
    accelerometer: bool
    gyroscope: bool
    distance: bool

    @classmethod
    def complete_glove(cls) -> "DeviceCapabilities":
        return cls((True, True, True, True, True), True, True, True, True)


@dataclass(frozen=True, slots=True)
class DeviceDescriptor:
    device_id: str
    display_name: str
    hand: Hand
    source_kind: str
    nominal_sample_rate_hz: float
    capabilities: DeviceCapabilities
    simulated: bool


@dataclass(frozen=True, slots=True)
class SensorPacket:
    protocol_version: str
    device_id: str
    boot_id: str
    hand: Hand
    sequence_number: int
    device_timestamp_ms: int
    host_timestamp_ns: int
    flex_raw: tuple[int | None, int | None, int | None, int | None, int | None]
    fsr_raw: int | None
    accel_raw: tuple[int | None, int | None, int | None]
    gyro_raw: tuple[int | None, int | None, int | None]
    distance_mm: int | None
    status_flags: int = 0
    quality_flags: QualityFlag = QualityFlag.NONE
    simulated: bool = False

    def __post_init__(self) -> None:
        if not self.device_id.strip():
            raise ValueError("device_id must not be empty")
        if not self.boot_id.strip():
            raise ValueError("boot_id must not be empty")
        if self.sequence_number < 0:
            raise ValueError("sequence_number must be non-negative")
        if self.device_timestamp_ms < 0 or self.host_timestamp_ns < 0:
            raise ValueError("timestamps must be non-negative")
        if len(self.flex_raw) != 5:
            raise ValueError("flex_raw must contain exactly five channels")
        if len(self.accel_raw) != 3 or len(self.gyro_raw) != 3:
            raise ValueError("IMU vectors must contain exactly three axes")
        if self.simulated and not self.quality_flags & QualityFlag.SIMULATED:
            raise ValueError("simulated packets must include QualityFlag.SIMULATED")


@dataclass(frozen=True, slots=True)
class DeviceStatistics:
    received_packets: int = 0
    lost_packets: int = 0
    sample_rate_hz: float = 0.0
    packet_loss_percent: float = 0.0
    last_packet_host_ns: int | None = None
    channel_stddev: Mapping[str, float] = field(default_factory=dict)
    channel_peak_to_peak: Mapping[str, float] = field(default_factory=dict)

