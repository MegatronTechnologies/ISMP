from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Union

from dotenv import load_dotenv


DETECTOR_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(DETECTOR_ROOT / ".env")

CameraSource = Union[int, str]


def _camera_source(value: str) -> CameraSource:
    value = value.strip()
    if value.lstrip("-").isdigit():
        return int(value)
    return value


def _int_list(value: str) -> tuple[int, ...]:
    classes = tuple(int(part.strip()) for part in value.split(",") if part.strip())
    if not classes:
        raise ValueError("ISMP_YOLO_CLASSES must contain at least one class id")
    return classes


def _origins(value: str) -> tuple[str, ...]:
    return tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("ISMP_EDGE_HOST", "127.0.0.1")
    port: int = int(os.getenv("ISMP_EDGE_PORT", "8001"))
    camera_source: CameraSource = _camera_source(os.getenv("ISMP_CAMERA_SOURCE", "0"))
    camera_name: str = os.getenv("ISMP_CAMERA_NAME", "Windows Built-in Camera")
    camera_backend: str = os.getenv("ISMP_CAMERA_BACKEND", "AUTO").strip().upper()
    camera_width: int = int(os.getenv("ISMP_CAMERA_WIDTH", "1280"))
    camera_height: int = int(os.getenv("ISMP_CAMERA_HEIGHT", "720"))
    camera_fps: int = int(os.getenv("ISMP_CAMERA_FPS", "30"))
    camera_reconnect_seconds: float = float(os.getenv("ISMP_CAMERA_RECONNECT_SECONDS", "2"))
    model_path: str = os.getenv("ISMP_YOLO_MODEL", "yolov8n.pt")
    target_classes: tuple[int, ...] = _int_list(os.getenv("ISMP_YOLO_CLASSES", "39"))
    confidence: float = float(os.getenv("ISMP_YOLO_CONFIDENCE", "0.45"))
    image_size: int = int(os.getenv("ISMP_YOLO_IMAGE_SIZE", "640"))
    device: str = os.getenv("ISMP_YOLO_DEVICE", "cpu")
    jpeg_quality: int = int(os.getenv("ISMP_JPEG_QUALITY", "82"))
    allowed_origins: tuple[str, ...] = _origins(
        os.getenv(
            "ISMP_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
    )

    def validate(self) -> None:
        if not 1 <= self.port <= 65535:
            raise ValueError("ISMP_EDGE_PORT must be between 1 and 65535")
        if self.camera_width <= 0 or self.camera_height <= 0 or self.camera_fps <= 0:
            raise ValueError("Camera width, height and FPS must be positive")
        if self.camera_backend not in {"AUTO", "DSHOW", "MSMF", "ANY"}:
            raise ValueError("ISMP_CAMERA_BACKEND must be AUTO, DSHOW, MSMF, or ANY")
        if not 0 < self.confidence <= 1:
            raise ValueError("ISMP_YOLO_CONFIDENCE must be between 0 and 1")
        if not 1 <= self.jpeg_quality <= 100:
            raise ValueError("ISMP_JPEG_QUALITY must be between 1 and 100")


settings = Settings()
settings.validate()
