"""Threaded acquisition, framework-neutral events, and bounded rolling buffers."""

from __future__ import annotations

import math
import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Callable, Literal

import numpy as np

from app.desktop_collector.domain import ConnectionState, DeviceStatistics, SensorPacket
from app.desktop_collector.sources import DataSource


CHANNEL_NAMES = (
    "flex_thumb_raw",
    "flex_index_raw",
    "flex_middle_raw",
    "flex_ring_raw",
    "flex_little_raw",
    "fsr_raw",
    "accel_x_raw",
    "accel_y_raw",
    "accel_z_raw",
    "gyro_x_raw",
    "gyro_y_raw",
    "gyro_z_raw",
    "distance_mm",
)

AcquisitionEventName = Literal["state", "packet", "statistics", "error"]
AcquisitionCallback = Callable[[str, object], None]
Unsubscribe = Callable[[], None]


def packet_channels(packet: SensorPacket) -> dict[str, int | None]:
    return {
        "flex_thumb_raw": packet.flex_raw[0],
        "flex_index_raw": packet.flex_raw[1],
        "flex_middle_raw": packet.flex_raw[2],
        "flex_ring_raw": packet.flex_raw[3],
        "flex_little_raw": packet.flex_raw[4],
        "fsr_raw": packet.fsr_raw,
        "accel_x_raw": packet.accel_raw[0],
        "accel_y_raw": packet.accel_raw[1],
        "accel_z_raw": packet.accel_raw[2],
        "gyro_x_raw": packet.gyro_raw[0],
        "gyro_y_raw": packet.gyro_raw[1],
        "gyro_z_raw": packet.gyro_raw[2],
        "distance_mm": packet.distance_mm,
    }


@dataclass(frozen=True, slots=True)
class BufferCursor:
    """Opaque per-device cursor for incremental display snapshots."""

    generation: int
    next_ingest_index: int


@dataclass(frozen=True, slots=True)
class PacketSnapshot:
    """Packets after a cursor without exposing mutable rolling-buffer state."""

    packets: tuple[SensorPacket, ...]
    next_cursor: BufferCursor
    overrun: bool = False


@dataclass
class _DeviceBuffer:
    generation: int = 0
    max_points: int = 30_000
    packets: deque[tuple[int, SensorPacket]] = field(
        default_factory=lambda: deque(maxlen=30_000)
    )
    arrival_monotonic: deque[float] = field(default_factory=lambda: deque(maxlen=2_000))
    received: int = 0
    lost: int = 0
    previous_sequence: int | None = None
    next_ingest_index: int = 0

    def append(self, packet: SensorPacket) -> None:
        if self.previous_sequence is not None and packet.sequence_number > self.previous_sequence + 1:
            self.lost += packet.sequence_number - self.previous_sequence - 1
        self.previous_sequence = packet.sequence_number
        self.received += 1
        self.packets.append((self.next_ingest_index, packet))
        self.next_ingest_index += 1
        now = time.monotonic()
        self.arrival_monotonic.append(now)
        cutoff = now - 3.0
        while self.arrival_monotonic and self.arrival_monotonic[0] < cutoff:
            self.arrival_monotonic.popleft()

    def statistics(self, window_seconds: float = 5.0) -> DeviceStatistics:
        now = time.monotonic()
        recent_arrivals = [value for value in self.arrival_monotonic if value >= now - 2.0]
        if len(recent_arrivals) >= 2:
            elapsed = recent_arrivals[-1] - recent_arrivals[0]
            sample_rate = (len(recent_arrivals) - 1) / elapsed if elapsed > 0 else 0.0
        else:
            sample_rate = 0.0

        last_host_ns = self.packets[-1][1].host_timestamp_ns if self.packets else None
        cutoff_ns = (last_host_ns or 0) - int(window_seconds * 1_000_000_000)
        recent_packets = [
            packet for _, packet in self.packets if packet.host_timestamp_ns >= cutoff_ns
        ]
        values: dict[str, list[float]] = {name: [] for name in CHANNEL_NAMES}
        for packet in recent_packets:
            for channel, value in packet_channels(packet).items():
                if value is not None:
                    values[channel].append(float(value))

        stddev = {
            channel: float(np.std(series)) if series else math.nan
            for channel, series in values.items()
        }
        peak_to_peak = {
            channel: float(np.ptp(series)) if series else math.nan
            for channel, series in values.items()
        }
        total = self.received + self.lost
        return DeviceStatistics(
            received_packets=self.received,
            lost_packets=self.lost,
            sample_rate_hz=sample_rate,
            packet_loss_percent=(self.lost / total * 100.0) if total else 0.0,
            last_packet_host_ns=last_host_ns,
            channel_stddev=stddev,
            channel_peak_to_peak=peak_to_peak,
        )

    def series(self, channel: str, window_seconds: float) -> tuple[np.ndarray, np.ndarray]:
        if not self.packets:
            return np.empty(0), np.empty(0)
        latest = self.packets[-1][1].host_timestamp_ns
        cutoff = latest - int(window_seconds * 1_000_000_000)
        points = [
            (packet.host_timestamp_ns, packet_channels(packet).get(channel))
            for _, packet in self.packets
            if packet.host_timestamp_ns >= cutoff
        ]
        points = [(timestamp, value) for timestamp, value in points if value is not None]
        if not points:
            return np.empty(0), np.empty(0)
        x = np.asarray([(timestamp - latest) / 1_000_000_000 for timestamp, _ in points])
        y = np.asarray([value for _, value in points], dtype=float)
        return x, y

    def current_cursor(self) -> BufferCursor:
        return BufferCursor(self.generation, self.next_ingest_index)

    def packets_since(self, cursor: BufferCursor, limit: int) -> PacketSnapshot:
        if limit < 1:
            raise ValueError("limit must be positive")
        oldest_index = self.packets[0][0] if self.packets else self.next_ingest_index
        overrun = cursor.generation != self.generation or cursor.next_ingest_index < oldest_index
        start_index = oldest_index if overrun else cursor.next_ingest_index
        selected = [
            (index, packet)
            for index, packet in self.packets
            if index >= start_index
        ][:limit]
        next_index = selected[-1][0] + 1 if selected else max(start_index, oldest_index)
        return PacketSnapshot(
            packets=tuple(packet for _, packet in selected),
            next_cursor=BufferCursor(self.generation, next_index),
            overrun=overrun,
        )

    def window_packets(self, window_seconds: float) -> tuple[SensorPacket, ...]:
        if not self.packets:
            return ()
        latest = self.packets[-1][1].host_timestamp_ns
        cutoff = latest - int(window_seconds * 1_000_000_000)
        return tuple(
            packet for _, packet in self.packets if packet.host_timestamp_ns >= cutoff
        )


class AcquisitionController:
    """Own one worker per source and expose framework-neutral snapshots/events."""

    _EVENTS: tuple[AcquisitionEventName, ...] = ("state", "packet", "statistics", "error")

    def __init__(self) -> None:
        self._sources: dict[str, DataSource] = {}
        self._buffers: dict[str, _DeviceBuffer] = {}
        self._threads: dict[str, threading.Thread] = {}
        self._stop_events: dict[str, threading.Event] = {}
        self._listeners: dict[AcquisitionEventName, set[AcquisitionCallback]] = {
            event: set() for event in self._EVENTS
        }
        self._lock = threading.RLock()

    @property
    def sources(self) -> tuple[DataSource, ...]:
        with self._lock:
            return tuple(self._sources.values())

    def subscribe(
        self, event: AcquisitionEventName, callback: AcquisitionCallback
    ) -> Unsubscribe:
        if event not in self._listeners:
            raise ValueError(f"unknown acquisition event: {event}")
        with self._lock:
            self._listeners[event].add(callback)

        def unsubscribe() -> None:
            with self._lock:
                self._listeners[event].discard(callback)

        return unsubscribe

    def _emit(self, event: AcquisitionEventName, device_id: str, payload: object) -> None:
        with self._lock:
            callbacks = tuple(self._listeners[event])
        for callback in callbacks:
            try:
                callback(device_id, payload)
            except Exception:
                # A UI or transport observer must never terminate acquisition.
                continue

    def register_source(self, source: DataSource) -> None:
        device_id = source.descriptor.device_id
        with self._lock:
            if device_id in self._sources:
                raise ValueError(f"source already registered: {device_id}")
            self._sources[device_id] = source
            self._buffers[device_id] = _DeviceBuffer()

    def connect_source(self, device_id: str) -> None:
        with self._lock:
            source = self._sources[device_id]
            existing = self._threads.get(device_id)
            if existing and existing.is_alive():
                return
            stop_event = threading.Event()
            worker = threading.Thread(
                target=self._worker_loop,
                args=(source, stop_event),
                name=f"acquisition-{device_id}",
                daemon=True,
            )
            self._stop_events[device_id] = stop_event
            self._threads[device_id] = worker
        self._emit("state", device_id, ConnectionState.CONNECTING)
        worker.start()

    def disconnect_source(self, device_id: str) -> None:
        with self._lock:
            source = self._sources[device_id]
            stop_event = self._stop_events.get(device_id)
            worker = self._threads.get(device_id)
            if stop_event:
                stop_event.set()
            source.disconnect()
        if worker and worker.is_alive() and worker is not threading.current_thread():
            worker.join(timeout=1.5)
        self._emit("state", device_id, ConnectionState.DISCONNECTED)

    def disconnect_all(self) -> None:
        for source in self.sources:
            self.disconnect_source(source.descriptor.device_id)

    shutdown = disconnect_all

    def active_worker_count(self) -> int:
        with self._lock:
            return sum(thread.is_alive() for thread in self._threads.values())

    def statistics(self, device_id: str, window_seconds: float = 5.0) -> DeviceStatistics:
        with self._lock:
            return self._buffers[device_id].statistics(window_seconds)

    def series(
        self, device_id: str, channel: str, window_seconds: float
    ) -> tuple[np.ndarray, np.ndarray]:
        with self._lock:
            return self._buffers[device_id].series(channel, window_seconds)

    def latest_packet(self, device_id: str) -> SensorPacket | None:
        with self._lock:
            packets = self._buffers[device_id].packets
            return packets[-1][1] if packets else None

    def current_cursor(self, device_id: str) -> BufferCursor:
        with self._lock:
            return self._buffers[device_id].current_cursor()

    def packets_since(
        self, device_id: str, cursor: BufferCursor, limit: int = 2_000
    ) -> PacketSnapshot:
        with self._lock:
            return self._buffers[device_id].packets_since(cursor, limit)

    def window_packets(
        self, device_id: str, window_seconds: float
    ) -> tuple[SensorPacket, ...]:
        with self._lock:
            return self._buffers[device_id].window_packets(window_seconds)

    def reset_device_data(self, device_id: str) -> None:
        with self._lock:
            previous = self._buffers[device_id]
            self._buffers[device_id] = _DeviceBuffer(generation=previous.generation + 1)

    def _worker_loop(self, source: DataSource, stop_event: threading.Event) -> None:
        device_id = source.descriptor.device_id
        last_stats_emit = 0.0
        try:
            source.connect()
            self._emit("state", device_id, ConnectionState.CONNECTED)
            while not stop_event.is_set():
                packet = source.read_packet(timeout_s=0.25)
                if packet is None:
                    continue
                with self._lock:
                    self._buffers[device_id].append(packet)
                self._emit("packet", device_id, packet)
                now = time.monotonic()
                if now - last_stats_emit >= 0.25:
                    with self._lock:
                        stats = self._buffers[device_id].statistics()
                    self._emit("statistics", device_id, stats)
                    last_stats_emit = now
        except Exception as exc:  # acquisition boundaries must surface transport failures
            self._emit("error", device_id, str(exc))
            self._emit("state", device_id, ConnectionState.ERROR)
        finally:
            source.disconnect()
            self._emit("state", device_id, ConnectionState.DISCONNECTED)
