"""Deterministic two-glove sensor simulator."""

from __future__ import annotations

import math
import random
import threading
import time
from dataclasses import dataclass, replace

from app.desktop_collector.domain import (
    ConnectionState,
    DeviceCapabilities,
    DeviceDescriptor,
    Hand,
    QualityFlag,
    SensorPacket,
)
from app.desktop_collector.sources.base import DataSource


@dataclass(frozen=True, slots=True)
class SimulationConfig:
    seed: int = 2026
    sample_rate_hz: float = 50.0
    noise_std: float = 7.0
    packet_loss_rate: float = 0.01

    def __post_init__(self) -> None:
        if not 1.0 <= self.sample_rate_hz <= 500.0:
            raise ValueError("sample_rate_hz must be between 1 and 500")
        if self.noise_std < 0:
            raise ValueError("noise_std must be non-negative")
        if not 0.0 <= self.packet_loss_rate < 1.0:
            raise ValueError("packet_loss_rate must be in [0, 1)")


class SimulatedDataSource(DataSource):
    """Generates realistic, reproducible raw glove readings."""

    def __init__(self, descriptor: DeviceDescriptor, config: SimulationConfig) -> None:
        if not descriptor.simulated:
            raise ValueError("simulated source requires descriptor.simulated=true")
        self._descriptor = descriptor
        self._config = config
        self._state = ConnectionState.DISCONNECTED
        self._rng = random.Random(config.seed)
        self._sequence = 0
        self._sample_index = 0
        self._next_due = 0.0
        self._lock = threading.RLock()
        self._stop_event = threading.Event()

    @property
    def descriptor(self) -> DeviceDescriptor:
        return self._descriptor

    @property
    def config(self) -> SimulationConfig:
        return self._config

    @property
    def state(self) -> ConnectionState:
        with self._lock:
            return self._state

    def connect(self) -> None:
        with self._lock:
            if self._state is ConnectionState.CONNECTED:
                return
            self._state = ConnectionState.CONNECTING
            self._stop_event.clear()
            self._next_due = time.monotonic()
            self._state = ConnectionState.CONNECTED

    def disconnect(self) -> None:
        self._stop_event.set()
        with self._lock:
            self._state = ConnectionState.DISCONNECTED

    def reconfigure(self, config: SimulationConfig) -> None:
        with self._lock:
            if self._state is not ConnectionState.DISCONNECTED:
                raise RuntimeError("disconnect simulator before reconfiguring")
            self._config = config
            self._descriptor = replace(
                self._descriptor, nominal_sample_rate_hz=config.sample_rate_hz
            )
            self._rng = random.Random(config.seed)
            self._sequence = 0
            self._sample_index = 0

    def rename(self, display_name: str) -> None:
        clean_name = display_name.strip()
        if not clean_name:
            raise ValueError("display name must not be empty")
        with self._lock:
            self._descriptor = replace(self._descriptor, display_name=clean_name)

    def read_packet(self, timeout_s: float = 0.25) -> SensorPacket | None:
        if self.state is not ConnectionState.CONNECTED:
            return None
        deadline = time.monotonic() + max(0.0, timeout_s)
        while not self._stop_event.is_set():
            now = time.monotonic()
            if now < self._next_due:
                remaining = min(self._next_due - now, deadline - now)
                if remaining <= 0:
                    return None
                self._stop_event.wait(remaining)
                continue

            packet = self.generate_next()
            self._next_due += 1.0 / self._config.sample_rate_hz
            if self._rng.random() < self._config.packet_loss_rate:
                if time.monotonic() >= deadline:
                    return None
                continue
            return packet
        return None

    def generate_next(self, host_timestamp_ns: int | None = None) -> SensorPacket:
        """Generate one intended packet without sleeping; useful for deterministic tests."""
        with self._lock:
            config = self._config
            index = self._sample_index
            sequence = self._sequence
            self._sample_index += 1
            self._sequence += 1

            t = index / config.sample_rate_hz
            side_phase = 0.0 if self._descriptor.hand is Hand.LEFT else 0.72

            def noisy(value: float, scale: float = 1.0) -> int:
                return int(round(value + self._rng.gauss(0.0, config.noise_std * scale)))

            flex = tuple(
                max(
                    0,
                    min(
                        4095,
                        noisy(
                            1900
                            + 720 * math.sin(2 * math.pi * (0.18 + finger * 0.018) * t + side_phase + finger * 0.6)
                            + 150 * math.sin(2 * math.pi * 0.035 * t + finger)
                        ),
                    ),
                )
                for finger in range(5)
            )
            pressure_wave = max(0.0, math.sin(2 * math.pi * 0.22 * t + side_phase) - 0.28)
            fsr = max(0, min(4095, noisy(300 + pressure_wave * 3500, 2.0)))
            accel = (
                noisy(1800 * math.sin(2 * math.pi * 0.42 * t + side_phase), 5.0),
                noisy(1400 * math.cos(2 * math.pi * 0.31 * t + side_phase), 5.0),
                noisy(16384 + 500 * math.sin(2 * math.pi * 0.2 * t), 5.0),
            )
            gyro = (
                noisy(1800 * math.cos(2 * math.pi * 0.42 * t + side_phase), 4.0),
                noisy(1300 * math.sin(2 * math.pi * 0.31 * t + side_phase), 4.0),
                noisy(700 * math.sin(2 * math.pi * 0.16 * t + side_phase), 4.0),
            )
            distance = max(30, noisy(260 + 110 * math.sin(2 * math.pi * 0.12 * t + side_phase), 0.6))

            return SensorPacket(
                protocol_version="sim-1",
                device_id=self._descriptor.device_id,
                boot_id=f"sim-boot-{self._config.seed}",
                hand=self._descriptor.hand,
                sequence_number=sequence,
                device_timestamp_ms=int(round(t * 1000)),
                host_timestamp_ns=host_timestamp_ns or time.time_ns(),
                flex_raw=flex,  # type: ignore[arg-type]
                fsr_raw=fsr,
                accel_raw=accel,
                gyro_raw=gyro,
                distance_mm=distance,
                quality_flags=QualityFlag.SIMULATED,
                simulated=True,
            )


def create_simulated_pair(
    seed: int = 2026,
    sample_rate_hz: float = 50.0,
    noise_std: float = 7.0,
    packet_loss_rate: float = 0.01,
) -> tuple[SimulatedDataSource, SimulatedDataSource]:
    capabilities = DeviceCapabilities.complete_glove()
    left_descriptor = DeviceDescriptor(
        device_id="SIM-GLOVE-L",
        display_name="Găng mô phỏng trái",
        hand=Hand.LEFT,
        source_kind="simulator",
        nominal_sample_rate_hz=sample_rate_hz,
        capabilities=capabilities,
        simulated=True,
    )
    right_descriptor = DeviceDescriptor(
        device_id="SIM-GLOVE-R",
        display_name="Găng mô phỏng phải",
        hand=Hand.RIGHT,
        source_kind="simulator",
        nominal_sample_rate_hz=sample_rate_hz,
        capabilities=capabilities,
        simulated=True,
    )
    return (
        SimulatedDataSource(
            left_descriptor,
            SimulationConfig(seed, sample_rate_hz, noise_std, packet_loss_rate),
        ),
        SimulatedDataSource(
            right_descriptor,
            SimulationConfig(seed + 1, sample_rate_hz, noise_std, packet_loss_rate),
        ),
    )

