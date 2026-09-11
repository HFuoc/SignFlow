from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QTimer

from app.desktop_collector.domain import ConnectionState
from app.desktop_collector.ui.main_window import MainWindow
from app.desktop_collector.ui.theme import DARK, LIGHT


ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


def total_received(window: MainWindow) -> int:
    return sum(
        window.controller.statistics(source.descriptor.device_id).received_packets
        for source in window.sources
    )


def test_startup_connect_pause_and_disconnect_remain_responsive(qtbot) -> None:
    window = MainWindow(auto_connect=True)
    qtbot.addWidget(window)
    window.show()
    qtbot.waitUntil(lambda: total_received(window) >= 20, timeout=3000)
    window.live_page.pause_button.setChecked(True)
    before_pause = total_received(window)
    qtbot.wait(450)
    assert window.live_page.is_chart_paused is True
    assert total_received(window) > before_pause

    first = window.sources[0]
    window.controller.disconnect_source(first.descriptor.device_id)
    qtbot.waitUntil(lambda: first.state is ConnectionState.DISCONNECTED, timeout=1500)
    assert window.isEnabled()


def test_two_sources_at_200_hz_do_not_block_ui_heartbeat(qtbot) -> None:
    window = MainWindow(auto_connect=False)
    qtbot.addWidget(window)
    heartbeat = {"count": 0}
    timer = QTimer(window)
    timer.setInterval(10)
    timer.timeout.connect(lambda: heartbeat.__setitem__("count", heartbeat["count"] + 1))
    timer.start()
    window._apply_simulation_config(100, 200.0, 5.0, 0.02)
    qtbot.waitUntil(lambda: total_received(window) >= 250, timeout=4000)
    assert heartbeat["count"] >= 25
    assert all(source.state is ConnectionState.CONNECTED for source in window.sources)


def _relative_luminance(color: str) -> float:
    values = [int(color[index : index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in values]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def _contrast(foreground: str, background: str) -> float:
    first, second = sorted((_relative_luminance(foreground), _relative_luminance(background)), reverse=True)
    return (first + 0.05) / (second + 0.05)


def test_primary_text_and_muted_tokens_meet_contrast_target() -> None:
    for palette in (LIGHT, DARK):
        assert _contrast(palette["text"], palette["surface"]) >= 4.5
        assert _contrast(palette["muted"], palette["surface"]) >= 4.5


def test_visual_light_dark_and_supported_sizes(qtbot) -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    window = MainWindow(auto_connect=True)
    qtbot.addWidget(window)
    window.show()
    qtbot.waitUntil(lambda: total_received(window) >= 10, timeout=3000)
    for width, height in ((1280, 720), (1440, 900)):
        window.resize(width, height)
        window._show_page(0)
        qtbot.wait(150)
        assert window.grab().save(str(ARTIFACTS / f"devices-light-{width}x{height}.png"))
        window._show_page(1)
        qtbot.wait(150)
        assert window.grab().save(str(ARTIFACTS / f"live-light-{width}x{height}.png"))
    window.toggle_theme()
    assert window.dark is True
    for width, height in ((1280, 720), (1440, 900)):
        window.resize(width, height)
        window._show_page(0)
        qtbot.wait(150)
        assert window.grab().save(str(ARTIFACTS / f"devices-dark-{width}x{height}.png"))
        window._show_page(1)
        qtbot.wait(150)
        assert window.grab().save(str(ARTIFACTS / f"live-dark-{width}x{height}.png"))
