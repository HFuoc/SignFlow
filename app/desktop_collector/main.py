"""SmartGlove Dataset Studio entrypoint."""

from __future__ import annotations

import argparse
import os
import sys

from PySide6.QtCore import QTimer
from PySide6.QtWidgets import QApplication

from app.desktop_collector.ui import MainWindow
from app.desktop_collector.ui.theme import application_font, install_application_font


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SmartGlove desktop sensor simulator")
    parser.add_argument(
        "--smoke-test",
        action="store_true",
        help="start offscreen, exercise acquisition briefly, then exit",
    )
    parser.add_argument(
        "--no-auto-connect", action="store_true", help="start with both simulator sources disconnected"
    )
    return parser


def create_application(argv: list[str] | None = None) -> QApplication:
    app = QApplication(argv or sys.argv)
    app.setApplicationName("SmartGlove Dataset Studio")
    app.setOrganizationName("SmartGlove DATN")
    app.setFont(application_font(install_application_font()))
    return app


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.smoke_test:
        os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    app = create_application([sys.argv[0]])
    window = MainWindow(auto_connect=not args.no_auto_connect)
    window.show()
    if args.smoke_test:
        QTimer.singleShot(1300, window.close)
        QTimer.singleShot(1500, app.quit)
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())

