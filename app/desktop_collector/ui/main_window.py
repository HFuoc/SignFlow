"""Application window containing only Milestone 1 screens."""

from __future__ import annotations

from PySide6.QtCore import QTimer, Qt
from PySide6.QtGui import QCloseEvent
from PySide6.QtWidgets import (
    QApplication,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMessageBox,
    QStackedWidget,
    QToolButton,
    QVBoxLayout,
    QWidget,
)

from app.desktop_collector.acquisition import AcquisitionController
from app.desktop_collector.domain import ConnectionState
from app.desktop_collector.sources import SimulationConfig, SimulatedDataSource, create_simulated_pair
from app.desktop_collector.ui.device_manager import DeviceManagerPage
from app.desktop_collector.ui.live_monitor import LiveMonitorPage
from app.desktop_collector.ui.qt_acquisition_adapter import QtAcquisitionAdapter
from app.desktop_collector.ui.theme import build_stylesheet, one_ui_icon


class MainWindow(QMainWindow):
    def __init__(self, auto_connect: bool = True) -> None:
        super().__init__()
        self.setWindowTitle("SmartGlove Dataset Studio · Simulation")
        self.resize(1440, 900)
        self.setMinimumSize(1120, 700)
        self.dark = False
        self.controller = AcquisitionController()
        self.qt_acquisition = QtAcquisitionAdapter(self.controller)
        self.sources: tuple[SimulatedDataSource, ...] = create_simulated_pair()
        for source in self.sources:
            self.controller.register_source(source)

        root = QWidget()
        root.setObjectName("AppRoot")
        root_layout = QHBoxLayout(root)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        sidebar = QWidget()
        sidebar.setObjectName("Sidebar")
        sidebar.setFixedWidth(116)
        nav = QVBoxLayout(sidebar)
        nav.setContentsMargins(14, 22, 14, 22)
        nav.setSpacing(12)
        brand = QLabel("SG")
        brand.setObjectName("Brand")
        brand.setAlignment(Qt.AlignmentFlag.AlignCenter)
        badge = QLabel("SIM")
        badge.setObjectName("SimulationBadge")
        badge.setAlignment(Qt.AlignmentFlag.AlignCenter)
        nav.addWidget(brand)
        nav.addWidget(badge)
        nav.addStretch(1)

        self.devices_button = self._nav_button("Thiết bị", "devices.svg")
        self.live_button = self._nav_button("Live", "sound-outline.svg")
        self.devices_button.setChecked(True)
        nav.addWidget(self.devices_button)
        nav.addWidget(self.live_button)
        nav.addStretch(1)
        self.theme_button = QToolButton()
        self.theme_button.setObjectName("NavButton")
        self.theme_button.setText("Tối")
        self.theme_button.setAccessibleName("Chuyển sang chế độ tối")
        self.theme_button.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextOnly)
        self.theme_button.clicked.connect(self.toggle_theme)
        nav.addWidget(self.theme_button)
        root_layout.addWidget(sidebar)

        self.stack = QStackedWidget()
        self.device_page = DeviceManagerPage(self.sources)
        self.live_page = LiveMonitorPage(self.controller, self.sources)
        self.stack.addWidget(self.device_page)
        self.stack.addWidget(self.live_page)
        root_layout.addWidget(self.stack, 1)
        self.setCentralWidget(root)

        self.devices_button.clicked.connect(lambda: self._show_page(0))
        self.live_button.clicked.connect(lambda: self._show_page(1))
        self.device_page.connection_requested.connect(self._set_connection)
        self.device_page.connect_all_requested.connect(self._connect_all)
        self.device_page.simulation_config_requested.connect(self._apply_simulation_config)
        self.device_page.name_changed.connect(self._rename_source)
        self.qt_acquisition.device_state_changed.connect(self.device_page.update_state)
        self.qt_acquisition.statistics_updated.connect(self.device_page.update_statistics)
        self.qt_acquisition.source_error.connect(self._show_source_error)
        self._apply_theme()

        if auto_connect:
            QTimer.singleShot(150, lambda: self._connect_all(True))

    def _nav_button(self, text: str, icon_name: str) -> QToolButton:
        button = QToolButton()
        button.setObjectName("NavButton")
        button.setText(text)
        button.setIcon(one_ui_icon(icon_name))
        button.setIconSize(button.iconSize().expandedTo(button.iconSize()))
        button.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextUnderIcon)
        button.setCheckable(True)
        button.setAutoExclusive(True)
        return button

    def _show_page(self, index: int) -> None:
        self.stack.setCurrentIndex(index)
        self.devices_button.setChecked(index == 0)
        self.live_button.setChecked(index == 1)

    def toggle_theme(self) -> None:
        self.dark = not self.dark
        self._apply_theme()

    def _apply_theme(self) -> None:
        app = QApplication.instance()
        if app:
            app.setStyleSheet(build_stylesheet(self.dark))
        self.theme_button.setText("Sáng" if self.dark else "Tối")
        self.theme_button.setAccessibleName(
            "Chuyển sang chế độ sáng" if self.dark else "Chuyển sang chế độ tối"
        )
        self.live_page.apply_plot_theme(self.dark)

    def _set_connection(self, device_id: str, connect: bool) -> None:
        if connect:
            self.controller.connect_source(device_id)
        else:
            self.controller.disconnect_source(device_id)

    def _connect_all(self, connect: bool) -> None:
        for source in self.sources:
            self._set_connection(source.descriptor.device_id, connect)

    def _apply_simulation_config(
        self, seed: int, sample_rate_hz: float, noise_std: float, packet_loss_rate: float
    ) -> None:
        self.controller.disconnect_all()
        for index, source in enumerate(self.sources):
            source.reconfigure(
                SimulationConfig(seed + index, sample_rate_hz, noise_std, packet_loss_rate)
            )
            self.controller.reset_device_data(source.descriptor.device_id)
        self._connect_all(True)

    def _rename_source(self, device_id: str, name: str) -> None:
        source = next(item for item in self.sources if item.descriptor.device_id == device_id)
        try:
            source.rename(name)
        except ValueError as exc:
            QMessageBox.warning(self, "Tên thiết bị không hợp lệ", str(exc))

    def _show_source_error(self, device_id: str, message: str) -> None:
        QMessageBox.critical(self, f"Lỗi nguồn {device_id}", message)

    def closeEvent(self, event: QCloseEvent) -> None:  # noqa: N802 - Qt API
        self.controller.disconnect_all()
        self.qt_acquisition.close()
        event.accept()
