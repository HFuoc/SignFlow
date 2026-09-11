"""Local authenticated HTTP/WebSocket bridge for the collector web UI."""

from .app import AppRuntime, create_app

__all__ = ["AppRuntime", "create_app"]
