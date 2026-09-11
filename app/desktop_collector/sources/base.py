"""Transport-neutral data source contract."""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.desktop_collector.domain import ConnectionState, DeviceDescriptor, SensorPacket


class DataSource(ABC):
    """Blocking packet source consumed by a dedicated acquisition worker."""

    @property
    @abstractmethod
    def descriptor(self) -> DeviceDescriptor:
        """Return stable device metadata."""

    @property
    @abstractmethod
    def state(self) -> ConnectionState:
        """Return the current source state."""

    @abstractmethod
    def connect(self) -> None:
        """Open the source. Must not be called from the UI thread for real transports."""

    @abstractmethod
    def disconnect(self) -> None:
        """Close the source and unblock pending reads."""

    @abstractmethod
    def read_packet(self, timeout_s: float = 0.25) -> SensorPacket | None:
        """Return one packet, or ``None`` on timeout/drop."""

