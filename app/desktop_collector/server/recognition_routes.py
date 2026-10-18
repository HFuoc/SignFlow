"""ID-only recognition API behind both existing authorization layers."""
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from app.desktop_collector.auth import COLLECTOR_ROLES
from app.desktop_collector.recognition.contracts import RecognitionError, require
from app.desktop_collector.recognition.captures import MAX_CAPTURE_BYTES
from app.desktop_collector.recognition.references import ReferenceCatalog


class JobRequest(BaseModel):
    model_config = {"extra": "forbid"}
    sample_id: str = Field(min_length=1, max_length=128)
    provider_id: str = Field(min_length=1, max_length=64)


def register_recognition(app, jobs, session_principal):
    router = APIRouter(prefix="/api/v1/recognition")
    uploading = set()

    async def owner(request):
        principal = await session_principal(request, roles=COLLECTOR_ROLES)
        return principal.session.id

    @app.exception_handler(RecognitionError)
    async def recognition_error(_, error):
        status = {"unknown_job": 404, "unknown_sample": 404, "job_active": 409,
                  "queue_full": 429, "service_stopped": 503, "provider_unavailable": 503,
                  "invalid_manifest": 503, "capture_size": 413, "capture_format": 415,
                  "capture_busy": 429, "capture_upload_timeout": 408,
                  "unknown_reference": 404, "reference_unavailable": 503}.get(error.code, 422)
        return JSONResponse({"code": error.code, "detail": "Recognition request could not complete."}, status_code=status)

    @router.get("/models")
    async def models(request: Request):
        await owner(request)
        return {"models": await asyncio.to_thread(jobs.catalog.models)}

    @router.get("/samples")
    async def samples(request: Request, provider_id: str | None = None):
        await owner(request)
        return {"samples": await asyncio.to_thread(jobs.catalog.samples, provider_id)} if provider_id is not None else {"samples": await asyncio.to_thread(jobs.catalog.samples)}

    @router.get("/references")
    async def references(request: Request, provider_id: str):
        await owner(request)
        require(list(request.query_params.multi_items()) == [("provider_id", provider_id)] and
                0 < len(provider_id) <= 64, "invalid_reference", "Only a provider ID is accepted")
        catalog = ReferenceCatalog(jobs.service.config.workspace)
        return {"references": await asyncio.to_thread(catalog.list, provider_id)}

    @router.get("/references/{reference_id}/media")
    async def reference_media(request: Request, reference_id: str):
        await owner(request)
        require(not request.query_params, "invalid_reference", "Reference media accepts no query")
        catalog = ReferenceCatalog(jobs.service.config.workspace)
        data = await asyncio.to_thread(catalog.media, reference_id)
        return Response(data, media_type="video/webm", headers={
            "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})

    @router.get("/jobs")
    async def list_jobs(request: Request):
        return {"jobs": jobs.list(await owner(request))}

    @router.post("/live-jobs", status_code=202)
    async def live_job(request: Request, topic_id: str):
        session = await owner(request)
        require(set(request.query_params) == {"topic_id"} and len(request.query_params.multi_items()) == 1 and len(topic_id) <= 64,
                "invalid_capture", "Only a topic ID is accepted")
        mime = request.headers.get("content-type", "").lower().replace(" ", "")
        require(mime in {"video/webm", "video/webm;codecs=vp8", "video/webm;codecs=vp9"},
                "capture_format", "Only video-only WebM is accepted")
        length = request.headers.get("content-length")
        require(length is None or (len(length) <= 10 and length.isascii() and length.isdecimal() and 0 < int(length) <= MAX_CAPTURE_BYTES),
                "capture_size", "Capture exceeds size limit")
        require(session not in uploading and len(uploading) < 2, "capture_busy", "Capture upload already active")
        uploading.add(session)
        try:
            provider = await asyncio.to_thread(jobs.live_provider, topic_id)
            data = bytearray()
            try:
                async with asyncio.timeout(15):
                    async for chunk in request.stream():
                        require(len(data) + len(chunk) <= MAX_CAPTURE_BYTES, "capture_size", "Capture exceeds size limit")
                        data.extend(chunk)
            except TimeoutError:
                raise RecognitionError("capture_upload_timeout", "Capture upload timed out") from None
            # No await between transferring ownership and returning its job identity.
            return jobs.submit_capture(session, data, provider)
        finally:
            uploading.discard(session)

    @router.post("/jobs", status_code=202)
    async def submit(request: Request, payload: JobRequest):
        return await asyncio.to_thread(jobs.submit, await owner(request), payload.sample_id, payload.provider_id)

    @router.get("/jobs/{job_id}")
    async def get_job(request: Request, job_id: str):
        return jobs.get(await owner(request), job_id)

    @router.delete("/jobs/{job_id}")
    async def cancel(request: Request, job_id: str):
        return jobs.cancel(await owner(request), job_id)

    app.include_router(router)
