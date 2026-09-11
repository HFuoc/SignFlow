"""Realtime multichannel monitor backed by acquisition snapshots."""

from __future__ import annotations

import math

import numpy as np
import pyqtgraph as pg
from PySide6.QtCore import Qt, QTimer
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QFrame,
    QGridLayout,
    QHeaderView,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from app.desktop_collector.acquisition import AcquisitionController, packet_channels
from app.desktop_collector.domain import ConnectionState, Hand
from app.desktop_collector.sources import SimulatedDataSource
from app.desktop_collector.ui.theme import DARK, LIGHT


SENSOR_GROUPS = {
    "Flex Sensor": (
        ("flex_thumb_raw", "Flex ngón cái"),
        ("flex_index_raw", "Flex ngón trỏ"),
        ("flex_middle_raw", "Flex ngón giữa"),
        ("flex_ring_raw", "Flex ngón áp út"),
        ("flex_little_raw", "Flex ngón út"),
    ),
    "FSR": (("fsr_raw", "Lực nhấn FSR"),),
    "Accelerometer": (
        ("accel_x_raw", "Accel X raw"),
        ("accel_y_raw", "Accel Y raw"),
        ("accel_z_raw", "Accel Z raw"),
    ),
    "Gyroscope": (
        ("gyro_x_raw", "Gyro X raw"),
        ("gyro_y_raw", "Gyro Y raw"),
        ("gyro_z_raw", "Gyro Z raw"),
    ),
    "VL53L0X": (("distance_mm", "Khoảng cách mm"),),
}

LEFT_COLORS = ("#176BDA", "#2B7FE8", "#438FF0", "#5B9DF4", "#73ABF8")
RIGHT_COLORS = ("#7654C4", "#8766D2", "#9879DE", "#A98CE7", "#BA9FEF")


class LiveMonitorPage(QWidget):
    def __init__(
        self,
        controller: AcquisitionController,
        sources: tuple[SimulatedDataSource, ...],
        dark: bool = False,
    ) -> None:
        super().__init__()
        self.controller = controller
        self.sources = sources
        self.dark = dark
        self.curves: dict[tuple[str, str], pg.PlotDataItem] = {}
        self.channel_checks: dict[str, QCheckBox] = {}
        self._chart_paused = False
        self._last_cursor_x: float | None = None

        root = QVBoxLayout(self)
        root.setContentsMargins(32, 28, 32, 28)
        root.setSpacing(16)

        heading = QHBoxLayout()
        titles = QVBoxLayout()
        eyebrow = QLabel("REALTIME · RAW · SIMULATED")
        eyebrow.setObjectName("Eyebrow")
        title = QLabel("Live Monitor")
        title.setObjectName("PageTitle")
        subtitle = QLabel("Pause chỉ dừng hiển thị đồ thị; acquisition và bộ đếm packet vẫn tiếp tục.")
        subtitle.setObjectName("PageSubtitle")
        titles.addWidget(eyebrow)
        titles.addWidget(title)
        titles.addWidget(subtitle)
        heading.addLayout(titles, 1)
        self.live_badge = QLabel("0 / 2 nguồn đang chạy")
        self.live_badge.setObjectName("SimulationBadge")
        self.live_badge.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.live_badge.setMinimumWidth(190)
        self.live_badge.setMaximumHeight(48)
        heading.addWidget(self.live_badge)
        root.addLayout(heading)

        controls = QFrame()
        controls.setObjectName("Card")
        controls_layout = QHBoxLayout(controls)
        controls_layout.setContentsMargins(16, 12, 16, 12)
        controls_layout.addWidget(QLabel("Nhóm cảm biến"))
        self.group_combo = QComboBox()
        self.group_combo.addItems(SENSOR_GROUPS.keys())
        self.group_combo.currentTextChanged.connect(self._rebuild_channels)
        controls_layout.addWidget(self.group_combo)
        controls_layout.addWidget(QLabel("Cửa sổ"))
        self.window_combo = QComboBox()
        for seconds in (5, 10, 30, 60):
            self.window_combo.addItem(f"{seconds} giây", seconds)
        self.window_combo.setCurrentIndex(1)
        controls_layout.addWidget(self.window_combo)
        self.pause_button = QPushButton("Pause đồ thị")
        self.pause_button.setCheckable(True)
        self.pause_button.setAccessibleDescription("Dừng vẽ nhưng không dừng nhận dữ liệu")
        self.pause_button.toggled.connect(self._set_paused)
        controls_layout.addWidget(self.pause_button)
        controls_layout.addStretch(1)
        raw_badge = QLabel("RAW ONLY")
        raw_badge.setObjectName("SimulationBadge")
        controls_layout.addWidget(raw_badge)
        root.addWidget(controls)

        self.channel_frame = QFrame()
        self.channel_frame.setObjectName("Card")
        self.channel_layout = QGridLayout(self.channel_frame)
        self.channel_layout.setContentsMargins(16, 12, 16, 12)
        root.addWidget(self.channel_frame)

        content = QHBoxLayout()
        chart_card = QFrame()
        chart_card.setObjectName("Card")
        chart_layout = QVBoxLayout(chart_card)
        chart_layout.setContentsMargins(14, 14, 14, 14)
        self.cursor_label = QLabel("Di chuột trên biểu đồ để xem thời điểm và giá trị gần nhất.")
        self.cursor_label.setObjectName("Muted")
        chart_layout.addWidget(self.cursor_label)
        self.plot = pg.PlotWidget()
        self.plot.setMinimumHeight(270)
        self.plot.setMouseEnabled(x=True, y=True)
        self.plot.showGrid(x=True, y=True, alpha=0.22)
        self.plot.setLabel("bottom", "Thời gian so với mẫu mới nhất", units="s")
        self.plot.addLegend(offset=(12, 12))
        self.crosshair = pg.InfiniteLine(angle=90, movable=False)
        self.plot.addItem(self.crosshair, ignoreBounds=True)
        self._mouse_proxy = pg.SignalProxy(
            self.plot.scene().sigMouseMoved, rateLimit=30, slot=self._mouse_moved
        )
        chart_layout.addWidget(self.plot, 1)
        content.addWidget(chart_card, 3)

        stats_card = QFrame()
        stats_card.setObjectName("Card")
        stats_layout = QVBoxLayout(stats_card)
        stats_layout.setContentsMargins(14, 14, 14, 14)
        stats_title = QLabel("Giá trị và chất lượng tín hiệu")
        stats_title.setStyleSheet("font-weight: 700; font-size: 12pt;")
        stats_layout.addWidget(stats_title)
        self.summary = QLabel("Chưa có dữ liệu")
        self.summary.setObjectName("Muted")
        self.summary.setWordWrap(True)
        stats_layout.addWidget(self.summary)
        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(("Tay", "Kênh", "Raw", "Std", "P–P", "Trạng thái"))
        self.table.setAlternatingRowColors(True)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.verticalHeader().setVisible(False)
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.Fixed)
        header.resizeSection(0, 42)
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        for column in (2, 3, 4, 5):
            header.setSectionResizeMode(column, QHeaderView.ResizeMode.ResizeToContents)
        stats_layout.addWidget(self.table, 1)
        content.addWidget(stats_card, 2)
        root.addLayout(content, 1)

        self._rebuild_channels(self.group_combo.currentText())
        self.apply_plot_theme(dark)
        self.refresh_timer = QTimer(self)
        self.refresh_timer.setInterval(100)
        self.refresh_timer.timeout.connect(self.refresh)
        self.refresh_timer.start()

    @property
    def is_chart_paused(self) -> bool:
        return self._chart_paused

    def _set_paused(self, paused: bool) -> None:
        self._chart_paused = paused
        self.pause_button.setText("Tiếp tục đồ thị" if paused else "Pause đồ thị")

    def _rebuild_channels(self, group: str) -> None:
        while self.channel_layout.count():
            item = self.channel_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self.channel_checks.clear()
        for index, (channel, display) in enumerate(SENSOR_GROUPS[group]):
            checkbox = QCheckBox(display)
            checkbox.setChecked(True)
            checkbox.stateChanged.connect(self._rebuild_curves)
            self.channel_layout.addWidget(checkbox, index // 4, index % 4)
            self.channel_checks[channel] = checkbox
        self._rebuild_curves()

    def _rebuild_curves(self) -> None:
        for curve in self.curves.values():
            self.plot.removeItem(curve)
        self.curves.clear()
        selected = [channel for channel, check in self.channel_checks.items() if check.isChecked()]
        for source in self.sources:
            palette = LEFT_COLORS if source.descriptor.hand is Hand.LEFT else RIGHT_COLORS
            style = Qt.PenStyle.SolidLine if source.descriptor.hand is Hand.LEFT else Qt.PenStyle.DashLine
            for index, channel in enumerate(selected):
                display = dict(SENSOR_GROUPS[self.group_combo.currentText()])[channel]
                pen = pg.mkPen(palette[index % len(palette)], width=2.2, style=style)
                curve = self.plot.plot(
                    [], [], pen=pen, name=f"{source.descriptor.hand.short_label} · {display}"
                )
                self.curves[(source.descriptor.device_id, channel)] = curve

    def apply_plot_theme(self, dark: bool) -> None:
        self.dark = dark
        colors = DARK if dark else LIGHT
        self.plot.setBackground(colors["surface"])
        for axis_name in ("left", "bottom"):
            axis = self.plot.getAxis(axis_name)
            axis.setPen(colors["muted"])
            axis.setTextPen(colors["muted"])
        self.crosshair.setPen(pg.mkPen(colors["warning"], width=1))

    def refresh(self) -> None:
        connected = sum(source.state is ConnectionState.CONNECTED for source in self.sources)
        self.live_badge.setText(f"{connected} / {len(self.sources)} nguồn đang chạy")
        window = float(self.window_combo.currentData())
        total_received = 0
        total_lost = 0
        rates: list[float] = []

        rows: list[tuple[str, str, str, str, str, str]] = []
        selected = [channel for channel, check in self.channel_checks.items() if check.isChecked()]
        labels = dict(SENSOR_GROUPS[self.group_combo.currentText()])
        for source in self.sources:
            device_id = source.descriptor.device_id
            stats = self.controller.statistics(device_id, min(window, 5.0))
            packet = self.controller.latest_packet(device_id)
            total_received += stats.received_packets
            total_lost += stats.lost_packets
            if stats.sample_rate_hz:
                rates.append(stats.sample_rate_hz)
            channel_values = packet_channels(packet) if packet else {}
            for channel in selected:
                value = channel_values.get(channel)
                std = stats.channel_stddev.get(channel, float("nan"))
                p2p = stats.channel_peak_to_peak.get(channel, float("nan"))
                if value is None:
                    status = "Không có dữ liệu"
                elif stats.packet_loss_percent > 2.0 or stats.sample_rate_hz < source.descriptor.nominal_sample_rate_hz * 0.8:
                    status = "Cần chú ý"
                else:
                    status = "Tốt"
                rows.append(
                    (
                        source.descriptor.hand.short_label,
                        labels[channel],
                        "—" if value is None else str(value),
                        "—" if math.isnan(std) else f"{std:.1f}",
                        "—" if math.isnan(p2p) else f"{p2p:.1f}",
                        status,
                    )
                )
                if not self._chart_paused:
                    x, y = self.controller.series(device_id, channel, window)
                    curve = self.curves.get((device_id, channel))
                    if curve is not None:
                        curve.setData(x, y)

        average_rate = float(np.mean(rates)) if rates else 0.0
        total = total_received + total_lost
        loss = total_lost / total * 100 if total else 0.0
        pause_note = " · đồ thị đang pause" if self._chart_paused else ""
        self.summary.setText(
            f"{total_received:,} packet nhận · {total_lost:,} mất ({loss:.2f}%) · "
            f"tần số trung bình {average_rate:.1f} Hz{pause_note}"
        )
        self._set_table_rows(rows)

    def _set_table_rows(self, rows: list[tuple[str, str, str, str, str, str]]) -> None:
        self.table.setRowCount(len(rows))
        for row_index, row in enumerate(rows):
            for column, value in enumerate(row):
                item = QTableWidgetItem(value)
                if column in (0, 2, 3, 4):
                    item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
                self.table.setItem(row_index, column, item)

    def _mouse_moved(self, event: tuple[object, ...]) -> None:
        position = event[0]
        if not self.plot.sceneBoundingRect().contains(position):
            return
        point = self.plot.getPlotItem().vb.mapSceneToView(position)
        x_value = float(point.x())
        self.crosshair.setPos(x_value)
        self._last_cursor_x = x_value
        values: list[str] = []
        for (device_id, channel), curve in self.curves.items():
            x_data, y_data = curve.getData()
            if x_data is None or len(x_data) == 0:
                continue
            index = int(np.argmin(np.abs(x_data - x_value)))
            hand = next(
                source.descriptor.hand.short_label
                for source in self.sources
                if source.descriptor.device_id == device_id
            )
            values.append(f"{hand}/{channel.replace('_raw', '')}: {y_data[index]:.0f}")
        self.cursor_label.setText(f"t = {x_value:.2f} s  ·  " + "  ·  ".join(values[:5]))
