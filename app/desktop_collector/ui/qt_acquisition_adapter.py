"""Temporary Qt signal adapter for the Milestone 1 PySide rollback UI."""

from __future__ import annotations

from PySide6.QtCore import QObject, Signal

from app.desktop_collector.acquisition import AcquisitionController, Unsubscribe


class QtAcquisitionAdapter(QObject):
    """Translate framework-neutral acquisition callbacks into queued Qt signals."""

    device_state_changed = Signal(str, object)
    packet_received = Signal(str, object)
    statistics_updated = Signal(str, object)
    source_error = Signal(str, str)

    def __init__(self, controller: AcquisitionController) -> None:
        super().__init__()
        self._unsubscribers: list[Unsubscribe] = [
            controller.subscribe("state", self.device_state_changed.emit),
            controller.subscribe("packet", self.packet_received.emit),
            controller.subscribe("statistics", self.statistics_updated.emit),
            controller.subscribe("error", self._emit_error),
        ]

    def _emit_error(self, device_id: str, payload: object) -> None:
        self.source_error.emit(device_id, str(payload))

    def close(self) -> None:
        while self._unsubscribers:
            self._unsubscribers.pop()()
