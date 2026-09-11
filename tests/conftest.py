"""Qt test environment configuration."""

from __future__ import annotations

import os

import pytest

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")


@pytest.fixture(scope="session")
def qapp():
    from PySide6.QtWidgets import QApplication

    from app.desktop_collector.ui.theme import application_font, install_application_font

    application = QApplication.instance() or QApplication([])
    application.setApplicationName("SmartGlove Dataset Studio Tests")
    application.setFont(application_font(install_application_font()))
    return application
