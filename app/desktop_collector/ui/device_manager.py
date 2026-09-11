"""Simulator-only device management page for Milestone 1."""

from __future__ import annotations

from datetime import datetime

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QDoubleSpinBox,
    QFormLayout,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

from app.desktop_collector.domain import ConnectionState, DeviceStatistics
from app.desktop_collector.sources import SimulatedDataSource


class DeviceCard(QFrame):
    connection_requested = Signal(str, bool)
    name_changed = Signal(str, str)

    def __init__(self, source: SimulatedDataSource) -> None:
        super().__init__()
        self.source = source
        self.setObjectName("Card")
        self.setMinimumWidth(330)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(14)

        header = QHBoxLayout()
        self.hand_badge = QLabel(source.descriptor.hand.short_label)
        self.hand_badge.setObjectName("HandBadge")
        self.hand_badge.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title_box = QVBoxLayout()
        self.name_edit = QLineEdit(source.descriptor.display_name)
        self.name_edit.setAccessibleName(f"Tên {source.descriptor.hand.display_name}")
        self.name_edit.editingFinished.connect(self._emit_name)
        device_id = QLabel(source.descriptor.device_id)
        device_id.setObjectName("Muted")
        title_box.addWidget(self.name_edit)
        title_box.addWidget(device_id)
        self.status = QLabel("Đã ngắt")
        self.status.setObjectName("StatusDisconnected")
        header.addWidget(self.hand_badge)
        header.addLayout(title_box, 1)
        header.addWidget(self.status)
        layout.addLayout(header)

        capabilities = QLabel("5 Flex  •  FSR  •  MPU6050  •  VL53L0X")
        capabilities.setObjectName("Muted")
        capabilities.setWordWrap(True)
        layout.addWidget(capabilities)

        metrics = QGridLayout()
        self.rate_value = self._metric(metrics, 0, "Tần số", "0.0 Hz")
        self.received_value = self._metric(metrics, 1, "Packet nhận", "0")
        self.lost_value = self._metric(metrics, 2, "Packet mất", "0")
        self.last_value = self._metric(metrics, 3, "Packet cuối", "—")
        layout.addLayout(metrics)

        self.connect_button = QPushButton("Kết nối mô phỏng")
        self.connect_button.setObjectName("PrimaryButton")
        self.connect_button.clicked.connect(self._toggle_connection)
        layout.addWidget(self.connect_button)

    @staticmethod
    def _metric(grid: QGridLayout, column: int, label: str, value: str) -> QLabel:
        frame = QFrame()
        frame.setObjectName("MetricCard")
        box = QVBoxLayout(frame)
        box.setContentsMargins(12, 10, 12, 10)
        title = QLabel(label)
        title.setObjectName("Muted")
        value_label = QLabel(value)
        value_label.setObjectName("MetricValue")
        box.addWidget(title)
        box.addWidget(value_label)
        grid.addWidget(frame, 0, column)
        return value_label

    def _toggle_connection(self) -> None:
        connect = self.source.state is not ConnectionState.CONNECTED
        self.connection_requested.emit(self.source.descriptor.device_id, connect)

    def _emit_name(self) -> None:
        self.name_changed.emit(self.source.descriptor.device_id, self.name_edit.text())

    def update_state(self, state: ConnectionState) -> None:
        connected = state is ConnectionState.CONNECTED
        self.status.setText("Đang chạy" if connected else "Đã ngắt")
        self.status.setObjectName("StatusConnected" if connected else "StatusDisconnected")
        self.status.style().unpolish(self.status)
        self.status.style().polish(self.status)
        self.connect_button.setText("Ngắt mô phỏng" if connected else "Kết nối mô phỏng")
        self.connect_button.setObjectName("DangerButton" if connected else "PrimaryButton")
        self.connect_button.style().unpolish(self.connect_button)
        self.connect_button.style().polish(self.connect_button)

    def update_statistics(self, stats: DeviceStatistics) -> None:
        self.rate_value.setText(f"{stats.sample_rate_hz:.1f} Hz")
        self.received_value.setText(f"{stats.received_packets:,}")
        self.lost_value.setText(f"{stats.lost_packets:,}")
        if stats.last_packet_host_ns:
            timestamp = datetime.fromtimestamp(stats.last_packet_host_ns / 1_000_000_000)
            self.last_value.setText(timestamp.strftime("%H:%M:%S"))
        else:
            self.last_value.setText("—")


class DeviceManagerPage(QWidget):
    connection_requested = Signal(str, bool)
    connect_all_requested = Signal(bool)
    simulation_config_requested = Signal(int, float, float, float)
    name_changed = Signal(str, str)

    def __init__(self, sources: tuple[SimulatedDataSource, ...]) -> None:
        super().__init__()
        self.cards: dict[str, DeviceCard] = {}
        root = QVBoxLayout(self)
        root.setContentsMargins(32, 28, 32, 28)
        root.setSpacing(22)

        heading = QHBoxLayout()
        titles = QVBoxLayout()
        eyebrow = QLabel("SIMULATION MODE")
        eyebrow.setObjectName("Eyebrow")
        title = QLabel("Device Manager")
        title.setObjectName("PageTitle")
        subtitle = QLabel("Hai nguồn mô phỏng dùng cùng interface với thiết bị thật trong milestone sau.")
        subtitle.setObjectName("PageSubtitle")
        titles.addWidget(eyebrow)
        titles.addWidget(title)
        titles.addWidget(subtitle)
        self.all_button = QPushButton("Kết nối cả hai")
        self.all_button.setObjectName("PrimaryButton")
        self.all_button.clicked.connect(self._toggle_all)
        heading.addLayout(titles, 1)
        heading.addWidget(self.all_button)
        root.addLayout(heading)

        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(18)
        for source in sources:
            card = DeviceCard(source)
            card.connection_requested.connect(self.connection_requested)
            card.name_changed.connect(self.name_changed)
            cards_layout.addWidget(card)
            self.cards[source.descriptor.device_id] = card
        root.addLayout(cards_layout)

        config_card = QFrame()
        config_card.setObjectName("Card")
        config_layout = QHBoxLayout(config_card)
        config_layout.setContentsMargins(20, 18, 20, 18)
        config_title = QVBoxLayout()
        label = QLabel("Cấu hình nguồn mô phỏng")
        label.setStyleSheet("font-weight: 700; font-size: 13pt;")
        note = QLabel("Áp dụng sẽ ngắt, reset chuỗi dữ liệu và kết nối lại cả hai găng.")
        note.setObjectName("Muted")
        config_title.addWidget(label)
        config_title.addWidget(note)
        config_layout.addLayout(config_title, 1)

        form = QFormLayout()
        self.seed = QSpinBox()
        self.seed.setRange(0, 2_147_483_646)
        self.seed.setValue(sources[0].config.seed)
        self.rate = QDoubleSpinBox()
        self.rate.setRange(1, 200)
        self.rate.setValue(sources[0].config.sample_rate_hz)
        self.rate.setSuffix(" Hz")
        self.noise = QDoubleSpinBox()
        self.noise.setRange(0, 200)
        self.noise.setValue(sources[0].config.noise_std)
        self.loss = QDoubleSpinBox()
        self.loss.setRange(0, 50)
        self.loss.setDecimals(2)
        self.loss.setValue(sources[0].config.packet_loss_rate * 100)
        self.loss.setSuffix(" %")
        form.addRow("Seed", self.seed)
        form.addRow("Sample rate", self.rate)
        form.addRow("Noise σ", self.noise)
        form.addRow("Packet loss", self.loss)
        config_layout.addLayout(form)
        apply_button = QPushButton("Áp dụng & khởi động lại")
        apply_button.clicked.connect(self._request_config)
        config_layout.addWidget(apply_button)
        root.addWidget(config_card)
        root.addStretch(1)

    def _request_config(self) -> None:
        self.simulation_config_requested.emit(
            self.seed.value(), self.rate.value(), self.noise.value(), self.loss.value() / 100.0
        )

    def _toggle_all(self) -> None:
        all_connected = all(
            card.source.state is ConnectionState.CONNECTED for card in self.cards.values()
        )
        self.connect_all_requested.emit(not all_connected)

    def update_state(self, device_id: str, state: ConnectionState) -> None:
        if device_id in self.cards:
            self.cards[device_id].update_state(state)
        all_connected = all(
            card.source.state is ConnectionState.CONNECTED for card in self.cards.values()
        )
        self.all_button.setText("Ngắt cả hai" if all_connected else "Kết nối cả hai")
        self.all_button.setObjectName("DangerButton" if all_connected else "PrimaryButton")
        self.all_button.style().unpolish(self.all_button)
        self.all_button.style().polish(self.all_button)

    def update_statistics(self, device_id: str, stats: DeviceStatistics) -> None:
        if device_id in self.cards:
            self.cards[device_id].update_statistics(stats)
