from __future__ import annotations

import inspect
import time

from app.desktop_collector.acquisition import AcquisitionController, BufferCursor
from app.desktop_collector.sources import create_simulated_pair


def test_acquisition_module_has_no_qt_dependency() -> None:
    import app.desktop_collector.acquisition as acquisition

    assert "PySide6" not in inspect.getsource(acquisition)


def test_framework_neutral_events_and_incremental_cursor() -> None:
    controller = AcquisitionController()
    source = create_simulated_pair(sample_rate_hz=100.0, packet_loss_rate=0.0)[0]
    controller.register_source(source)
    device_id = source.descriptor.device_id
    states: list[object] = []
    packets: list[object] = []
    unsubscribe_state = controller.subscribe("state", lambda _, state: states.append(state))
    unsubscribe_packet = controller.subscribe("packet", lambda _, packet: packets.append(packet))
    cursor = controller.current_cursor(device_id)

    controller.connect_source(device_id)
    deadline = time.monotonic() + 2.0
    while len(packets) < 8 and time.monotonic() < deadline:
        time.sleep(0.01)
    snapshot = controller.packets_since(device_id, cursor)
    controller.disconnect_all()
    unsubscribe_state()
    unsubscribe_packet()

    assert len(snapshot.packets) >= 8
    assert snapshot.overrun is False
    assert snapshot.next_cursor.next_ingest_index >= 8
    assert states
    assert controller.active_worker_count() == 0


def test_buffer_reset_marks_previous_cursor_for_resync() -> None:
    controller = AcquisitionController()
    source = create_simulated_pair()[0]
    controller.register_source(source)
    device_id = source.descriptor.device_id
    old_cursor = BufferCursor(generation=0, next_ingest_index=0)
    controller.reset_device_data(device_id)

    snapshot = controller.packets_since(device_id, old_cursor)

    assert snapshot.overrun is True
    assert snapshot.next_cursor.generation == 1
