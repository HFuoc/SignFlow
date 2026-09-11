"""One UI-inspired application tokens and asset helpers."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtGui import QFont, QFontDatabase, QIcon, QRawFont


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
ONE_UI_ASSET_ROOT = REPOSITORY_ROOT / "app" / "frontend" / "desktop" / "assets" / "one-ui"
FONT_ASSET_ROOT = REPOSITORY_ROOT / "app" / "frontend" / "desktop" / "assets" / "fonts"


LIGHT = {
    "bg": "#F1F1F3",
    "surface": "#FCFCFF",
    "surface_soft": "#E7E9EF",
    "surface_high": "#DADDE5",
    "text": "#121318",
    "muted": "#5F6573",
    "outline": "#CDD1DA",
    "primary": "#387AFF",
    "primary_hover": "#1D5FE8",
    "primary_soft": "#E3EBFF",
    "success": "#176F50",
    "success_soft": "#DEF5EB",
    "warning": "#8A4B00",
    "warning_soft": "#FFF0D2",
    "danger": "#A92F25",
    "danger_soft": "#FFEBE8",
}

DARK = {
    "bg": "#111318",
    "surface": "#1B1E25",
    "surface_soft": "#252933",
    "surface_high": "#303541",
    "text": "#F4F6FA",
    "muted": "#B7BDCA",
    "outline": "#454B59",
    "primary": "#6D98FF",
    "primary_hover": "#8CADFF",
    "primary_soft": "#23345E",
    "success": "#6FD6AB",
    "success_soft": "#183A30",
    "warning": "#FFC56D",
    "warning_soft": "#493415",
    "danger": "#FF8F86",
    "danger_soft": "#4C2525",
}


def one_ui_icon(name: str) -> QIcon:
    path = ONE_UI_ASSET_ROOT / name
    return QIcon(str(path)) if path.is_file() else QIcon()


def install_application_font() -> str:
    """Try the existing DM Sans WOFF2 assets, then use Segoe UI."""
    filenames = (
        "dm-sans-latin-ext-400-normal.woff2",
        "dm-sans-latin-400-normal.woff2",
        "dm-sans-latin-ext-500-normal.woff2",
        "dm-sans-latin-500-normal.woff2",
        "dm-sans-latin-ext-600-normal.woff2",
        "dm-sans-latin-600-normal.woff2",
        "dm-sans-latin-ext-700-normal.woff2",
        "dm-sans-latin-700-normal.woff2",
    )
    raw_fonts = [QRawFont(str(FONT_ASSET_ROOT / filename), 12) for filename in filenames]
    required_characters = "SmartGlove tiếng Việt"
    if raw_fonts and all(font.isValid() for font in raw_fonts) and all(
        any(font.supportsCharacter(ord(character)) for font in raw_fonts)
        for character in required_characters
    ):
        discovered_families: list[str] = []
        for filename in filenames:
            font_id = QFontDatabase.addApplicationFont(str(FONT_ASSET_ROOT / filename))
            if font_id >= 0:
                discovered_families.extend(QFontDatabase.applicationFontFamilies(font_id))
        if discovered_families:
            return discovered_families[0]
    return "Segoe UI"


def application_font(family: str) -> QFont:
    font = QFont(family)
    font.setPointSize(10)
    return font


def build_stylesheet(dark: bool) -> str:
    c = DARK if dark else LIGHT
    return f"""
    * {{
        color: {c['text']};
        font-size: 10pt;
    }}
    QMainWindow, QWidget#AppRoot {{ background: {c['bg']}; }}
    QWidget#Sidebar {{
        background: {c['surface']};
        border-right: 1px solid {c['outline']};
    }}
    QLabel#Brand {{ font-size: 18pt; font-weight: 700; }}
    QLabel#Eyebrow {{ color: {c['primary']}; font-size: 9pt; font-weight: 700; }}
    QLabel#PageTitle {{ font-size: 25pt; font-weight: 700; }}
    QLabel#PageSubtitle, QLabel#Muted {{ color: {c['muted']}; }}
    QLabel#SimulationBadge {{
        color: {c['primary']}; background: {c['primary_soft']};
        border-radius: 12px; padding: 5px 10px; font-weight: 700;
    }}
    QFrame#Card, QWidget#Card {{
        background: {c['surface']}; border: 1px solid {c['outline']};
        border-radius: 22px;
    }}
    QFrame#MetricCard {{
        background: {c['surface_soft']}; border: 1px solid {c['outline']};
        border-radius: 16px;
    }}
    QLabel#MetricValue {{ font-size: 17pt; font-weight: 700; }}
    QLabel#HandBadge {{
        color: #FFFFFF; background: {c['primary']}; border-radius: 18px;
        min-width: 36px; min-height: 36px; font-weight: 700;
    }}
    QLabel#StatusConnected {{
        color: {c['success']}; background: {c['success_soft']};
        border-radius: 10px; padding: 4px 9px; font-weight: 700;
    }}
    QLabel#StatusDisconnected {{
        color: {c['muted']}; background: {c['surface_soft']};
        border-radius: 10px; padding: 4px 9px; font-weight: 700;
    }}
    QPushButton, QToolButton, QComboBox, QSpinBox, QDoubleSpinBox, QLineEdit {{
        min-height: 36px; border: 1px solid {c['outline']}; border-radius: 12px;
        background: {c['surface_soft']}; padding: 0 12px;
    }}
    QPushButton:hover, QToolButton:hover, QComboBox:hover {{ border-color: {c['primary']}; }}
    QPushButton:focus, QToolButton:focus, QComboBox:focus, QSpinBox:focus,
    QDoubleSpinBox:focus, QLineEdit:focus, QCheckBox:focus {{
        border: 2px solid {c['primary']};
    }}
    QPushButton#PrimaryButton {{
        color: #FFFFFF; background: {c['primary']}; border: 0; font-weight: 700;
        padding: 0 18px;
    }}
    QPushButton#PrimaryButton:hover {{ background: {c['primary_hover']}; }}
    QPushButton#DangerButton {{ color: {c['danger']}; background: {c['danger_soft']}; font-weight: 700; }}
    QToolButton#NavButton {{
        min-width: 70px; min-height: 68px; color: #FFFFFF;
        background: #626A78; border: 0; border-radius: 20px; font-weight: 700;
    }}
    QToolButton#NavButton:checked {{ background: {c['primary']}; }}
    QHeaderView::section {{
        background: {c['surface_soft']}; color: {c['muted']};
        border: 0; border-bottom: 1px solid {c['outline']}; padding: 8px;
    }}
    QTableWidget {{
        background: {c['surface']}; alternate-background-color: {c['surface_soft']};
        border: 1px solid {c['outline']}; border-radius: 14px; gridline-color: {c['outline']};
    }}
    QScrollArea {{ border: 0; background: transparent; }}
    QCheckBox {{ spacing: 7px; }}
    QCheckBox::indicator {{ width: 18px; height: 18px; }}
    QCheckBox::indicator:checked {{ background: {c['primary']}; border: 2px solid {c['primary']}; border-radius: 5px; }}
    QSplitter::handle {{ background: {c['outline']}; width: 2px; height: 2px; }}
    QToolTip {{ color: {c['text']}; background: {c['surface']}; border: 1px solid {c['outline']}; }}
    """
