"""Authenticated one-frame-in-flight transport to the isolated camera worker."""
import asyncio
import time

from anyio import CancelScope
from fastapi import WebSocket, WebSocketDisconnect

from app.desktop_collector.auth import COLLECTOR_ROLES, PermissionDenied, SessionInvalid
from app.desktop_collector.recognition.contracts import RecognitionError, decode, require
from app.desktop_collector.recognition.streaming import IDLE_TIMEOUT_S, SESSION_TIMEOUT_S


def _control(message):
    if message["type"] == "websocket.disconnect":
        raise WebSocketDisconnect(message.get("code", 1000))
    text = message.get("text")
    require(isinstance(text, str) and len(text) <= 4096,
            "stream_protocol", "Expected a bounded camera control message")
    try:
        return decode(text.encode("utf-8"))
    except (ValueError, UnicodeError):
        raise RecognitionError("stream_protocol", "Invalid camera control message") from None


def register_stream(app, runtime, expected_host, allowed_origins, cookie_name):
    @app.websocket("/api/v1/recognition/stream")
    async def camera_stream(websocket: WebSocket):
        if websocket.headers.get("host", "") != expected_host:
            await websocket.close(code=1008, reason="invalid local host")
            return
        if websocket.headers.get("origin", "") not in allowed_origins or websocket.url.query:
            await websocket.close(code=1008, reason="origin or query not allowed")
            return
        await websocket.accept()
        lease = None
        receive = work = cancelled = None
        principal = None
        try:
            first = _control(await asyncio.wait_for(websocket.receive(), timeout=3))
            if not (isinstance(first, dict) and set(first) in ({"type", "token"}, {"type", "token", "provider_id"})
                    and first["type"] == "authenticate" and isinstance(first["token"], str)
                    and runtime.token_matches(first["token"])):
                await websocket.close(code=1008, reason="authentication required")
                return

            async def authorize():
                current = await asyncio.to_thread(runtime.auth.validate_session, websocket.cookies.get(cookie_name))
                runtime.auth.require_roles(current, COLLECTOR_ROLES)
                if current.user.must_change_password:
                    raise PermissionDenied()
                return current

            principal = await authorize()
            if 'provider_id' in first:
                lease = runtime.recognition_streams.acquire(principal.session.id, first['provider_id'])
            else:
                lease = runtime.recognition_streams.acquire(principal.session.id)
            runtime.hub.add(websocket, principal.session.id, lease.cancel)
            receive = asyncio.create_task(websocket.receive())

            async def wait_cancelled():
                while not lease.cancelled.is_set():
                    await asyncio.sleep(.025)

            cancelled = asyncio.create_task(wait_cancelled())

            async def exchange(operation, *args):
                nonlocal work
                work = asyncio.create_task(asyncio.to_thread(operation, *args))
                done, _ = await asyncio.wait((work, receive, cancelled), return_when=asyncio.FIRST_COMPLETED)
                require(cancelled not in done, "cancelled", "Camera stream stopped")
                if receive in done:
                    message = receive.result()
                    lease.cancel()
                    if message["type"] == "websocket.disconnect":
                        raise WebSocketDisconnect(message.get("code", 1000))
                    if message.get("text") and _control(message) == {"type": "stop"}:
                        raise WebSocketDisconnect(1000)
                    raise RecognitionError("stream_backpressure", "Wait for each camera frame acknowledgement")
                response = await work
                work = None
                require(not lease.cancelled.is_set(), "cancelled", "Camera stream stopped")
                return response

            await exchange(runtime.recognition.service.reserve_stream, lease.stream_id)
            ready = await exchange(lease.start)
            await websocket.send_json(ready)
            deadline = time.monotonic() + SESSION_TIMEOUT_S
            while True:
                remaining = deadline - time.monotonic()
                require(remaining > 0, "stream_timeout", "Camera stream reached its time limit; enable Auto again")
                done, _ = await asyncio.wait((receive, cancelled), timeout=min(IDLE_TIMEOUT_S, remaining),
                                             return_when=asyncio.FIRST_COMPLETED)
                require(cancelled not in done, "cancelled", "Camera stream stopped")
                require(receive in done, "stream_timeout", "Camera stream timed out; enable Auto again")
                message = receive.result()
                if message["type"] == "websocket.disconnect":
                    raise WebSocketDisconnect(message.get("code", 1000))
                if message.get("text") is not None:
                    require(_control(message) == {"type": "stop"}, "stream_protocol", "Unknown camera control message")
                    await websocket.close(code=1000)
                    return
                data = message.get("bytes")
                require(isinstance(data, bytes), "stream_protocol", "Camera frame must be binary")
                arrived = time.perf_counter()
                await authorize()
                authorized = time.perf_counter()
                receive = asyncio.create_task(websocket.receive())
                frame = await exchange(lease.frame, data)
                completed = time.perf_counter()
                frame["quality"] = {**frame.get("quality", {}),
                                    "authorization_ms": (authorized - arrived) * 1000,
                                    "worker_roundtrip_ms": (completed - authorized) * 1000,
                                    "bridge_ms": (completed - arrived) * 1000}
                await websocket.send_json(frame)
        except SessionInvalid:
            await websocket.close(code=4401, reason="user session ended")
        except PermissionDenied:
            runtime.auth.record_denied(principal, action="WEBSOCKET", path=websocket.url.path)
            await websocket.close(code=4403, reason="collector access denied")
        except RecognitionError as error:
            try:
                await websocket.send_json({"type": "error", "code": error.code, "message": str(error)})
                await websocket.close(code=1008, reason="camera stream stopped")
            except (RuntimeError, WebSocketDisconnect):
                pass
        except asyncio.TimeoutError:
            await websocket.close(code=1008, reason="authentication timeout")
        except (WebSocketDisconnect, asyncio.CancelledError):
            try:
                await websocket.close(code=1000)
            except (RuntimeError, WebSocketDisconnect):
                pass
        except Exception:
            try:
                await websocket.close(code=1011, reason="local camera stream error")
            except (RuntimeError, WebSocketDisconnect):
                pass
        finally:
            # ASGI disconnect/shutdown cancellation must not interrupt worker reaping.
            with CancelScope(shield=True):
                if lease:
                    lease.cancel()
                for task in (receive, cancelled):
                    if task:
                        task.cancel()
                        await asyncio.gather(task, return_exceptions=True)
                if work:
                    await asyncio.gather(work, return_exceptions=True)
                if lease:
                    await asyncio.to_thread(runtime.recognition_streams.release, lease)
                    runtime.recognition.service.release_stream(lease.stream_id)
                runtime.hub.discard(websocket)
