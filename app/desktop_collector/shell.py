"""PyWebView shell and lifecycle owner for the Milestone 1.1 collector."""

from __future__ import annotations

import argparse
import secrets
import socket
import sys
import tempfile
import threading
import time
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

import uvicorn

from app.desktop_collector.persistence import PersistenceStartupError
from app.desktop_collector.server import create_app


LOOPBACK_HOST = "127.0.0.1"


class LoopbackServer:
    """Own one loopback socket, one in-memory token, and one Uvicorn thread."""

    def __init__(
        self,
        *,
        development: bool = False,
        development_origin: str = "http://127.0.0.1:5173",
        auto_connect: bool = True,
        web_build_dir: Path | None = None,
        database_path: Path | None = None,
        _session_token_for_testing: str | None = None,
    ) -> None:
        self.development = development
        self.development_origin = development_origin.rstrip("/")
        self._token = _session_token_for_testing or secrets.token_urlsafe(32)
        self._socket = self._open_socket()
        self.port = int(self._socket.getsockname()[1])
        self.origin = f"http://{LOOPBACK_HOST}:{self.port}"
        allowed_origins = (
            (self.origin, self.development_origin)
            if development
            else (self.origin,)
        )
        try:
            self.app = create_app(
                session_token=self._token,
                port=self.port,
                allowed_origins=allowed_origins,
                development=development,
                auto_connect=auto_connect,
                web_build_dir=web_build_dir,
                database_path=database_path,
            )
        except Exception:
            self._token = ""
            self._socket.close()
            raise
        config = uvicorn.Config(
            self.app,
            host=LOOPBACK_HOST,
            port=self.port,
            access_log=False,
            log_level="warning",
            lifespan="on",
        )
        self._uvicorn = uvicorn.Server(config)
        self._thread = threading.Thread(
            target=self._run,
            name="smartglove-loopback-server",
            daemon=True,
        )
        self._shutdown_lock = threading.Lock()
        self._shutdown_complete = False

    @staticmethod
    def _open_socket() -> socket.socket:
        listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        listener.set_inheritable(False)
        listener.bind((LOOPBACK_HOST, 0))
        listener.listen(128)
        return listener

    @property
    def launch_url(self) -> str:
        base = self.development_origin if self.development else self.origin
        fragment = urlencode({"api": self.origin, "token": self._token})
        return f"{base}/#{fragment}"

    @property
    def is_alive(self) -> bool:
        return self._thread.is_alive()

    def _run(self) -> None:
        self._uvicorn.run(sockets=[self._socket])

    def start(self, timeout_s: float = 8.0) -> None:
        self._thread.start()
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            if self._uvicorn.started:
                return
            if not self._thread.is_alive():
                break
            time.sleep(0.02)
        self.shutdown()
        raise RuntimeError("local collector server did not start")

    def healthcheck(self, timeout_s: float = 2.0) -> bool:
        try:
            with urlopen(f"{self.origin}/api/v1/health", timeout=timeout_s) as response:
                return response.status == 200 and response.read() == b'{"status":"ok"}'
        except (OSError, URLError):
            return False

    def shutdown(self, timeout_s: float = 5.0) -> None:
        """Stop all local activity in the required, idempotent order."""

        with self._shutdown_lock:
            if self._shutdown_complete:
                return
            self._shutdown_complete = True

        runtime = self.app.state.runtime
        runtime.stop_acquisition()
        runtime.close_websockets_threadsafe()
        self._uvicorn.should_exit = True
        if self._thread.is_alive() and self._thread is not threading.current_thread():
            self._thread.join(timeout=timeout_s)
        try:
            self._socket.close()
        finally:
            runtime.clear_secret()


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SmartGlove React collector shell")
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Open an explicitly configured Vite origin; security remains enabled.",
    )
    parser.add_argument(
        "--vite-origin",
        default="http://127.0.0.1:5173",
        help="Exact loopback Vite origin used only with --dev.",
    )
    parser.add_argument(
        "--smoke-test",
        action="store_true",
        help="Start, health-check, and stop the local bridge without opening a window.",
    )
    parser.add_argument("--e2e-server", action="store_true", help=argparse.SUPPRESS)
    return parser


class DesktopWindowApi:
    """Minimal PyWebView-only window controls exposed to the React shell."""

    def __init__(self) -> None:
        self._window = None

    def bind_window(self, window: object) -> None:
        self._window = window

    def toggle_fullscreen(self) -> bool:
        window = self._window
        if window is None:
            return False
        window.toggle_fullscreen()
        return True


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    build_dir = Path(__file__).resolve().parent / "web" / "build"
    if not args.dev and not args.smoke_test and not build_dir.is_dir():
        raise SystemExit(
            "React build is missing. Run the web build first, or use --dev with Vite."
        )

    test_token = sys.stdin.readline().strip() if args.e2e_server else None
    if args.e2e_server and not test_token:
        raise SystemExit("e2e session token was not supplied")
    e2e_data = tempfile.TemporaryDirectory(prefix="smartglove-e2e-") if args.e2e_server else None
    server: LoopbackServer | None = None
    try:
        try:
            server = LoopbackServer(
                development=args.dev,
                development_origin=args.vite_origin,
                web_build_dir=build_dir,
                database_path=Path(e2e_data.name) / "smartglove.sqlite3" if e2e_data else None,
                _session_token_for_testing=test_token,
            )
        except PersistenceStartupError as error:
            raise SystemExit(str(error)) from None
        server.start()
        if not server.healthcheck():
            raise RuntimeError("local bridge health check failed")
        if args.smoke_test:
            return 0
        if args.e2e_server:
            print(f"PORT={server.port}", flush=True)
            sys.stdin.readline()
            return 0

        import webview

        window_api = DesktopWindowApi()
        window = webview.create_window(
            "SmartGlove Dataset Studio",
            server.launch_url,
            js_api=window_api,
            width=1440,
            height=900,
            min_size=(1120, 700),
            background_color="#F7F7FA",
        )
        window_api.bind_window(window)
        window.events.closed += lambda *_: server.shutdown()
        webview.start(debug=False, private_mode=True)
        return 0
    finally:
        if server is not None:
            server.shutdown()
        if e2e_data is not None:
            e2e_data.cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
