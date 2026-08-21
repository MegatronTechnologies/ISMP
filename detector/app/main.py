from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from . import __version__
from .config import settings
from .stream_service import CameraStreamService
from .yolo_detector import YoloDetector


detector = YoloDetector(settings)
stream_service = CameraStreamService(settings, detector)


@asynccontextmanager
async def lifespan(_: FastAPI):
    stream_service.start()
    yield
    stream_service.stop()


app = FastAPI(
    title="ISMP Edge Stream Service",
    version=__version__,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class CameraSelection(BaseModel):
    source: Union[int, str]

    @field_validator("source")
    @classmethod
    def source_must_not_be_blank(cls, value: Union[int, str]) -> Union[int, str]:
        if isinstance(value, str) and not value.strip():
            raise ValueError("Camera source cannot be blank")
        return value.strip() if isinstance(value, str) else value


@app.get("/api/v1/health")
def health() -> dict:
    status = stream_service.status()
    return {
        "ok": status["service"]["state"] == "ONLINE",
        "ready": (
            status["camera"]["state"] == "ONLINE"
            and status["detector"]["state"] == "READY"
        ),
        "version": __version__,
        "camera": status["camera"]["state"],
        "detector": status["detector"]["state"],
    }


@app.get("/api/v1/status")
def status() -> dict:
    return stream_service.status()


@app.get("/api/v1/stream.mjpg")
def stream() -> StreamingResponse:
    return StreamingResponse(
        stream_service.mjpeg_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
    )


@app.post("/api/v1/camera")
def select_camera(selection: CameraSelection) -> dict:
    if isinstance(selection.source, int) and selection.source < 0:
        raise HTTPException(status_code=400, detail="Camera index must be zero or greater")
    stream_service.select_source(selection.source)
    return {"ok": True, "source": selection.source, "state": "RECONNECTING"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
