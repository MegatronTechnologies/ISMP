from __future__ import annotations

import threading
import time
from typing import Any

import numpy as np

from .config import Settings


class YoloDetector:
    """Loads YOLO asynchronously and filters inference to configured class ids."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._model: Any = None
        self._state = "STARTING"
        self._error: str | None = None
        self._load_thread: threading.Thread | None = None
        self._lock = threading.RLock()

    def start(self) -> None:
        if self._load_thread and self._load_thread.is_alive():
            return
        self._load_thread = threading.Thread(
            target=self._load_model,
            name="ismp-yolo-loader",
            daemon=True,
        )
        self._load_thread.start()

    def _load_model(self) -> None:
        with self._lock:
            self._state = "LOADING"
            self._error = None
        try:
            from ultralytics import YOLO

            model = YOLO(self.settings.model_path)
            with self._lock:
                self._model = model
                self._state = "READY"
        except Exception as exc:  # service keeps raw camera streaming on model failure
            with self._lock:
                self._state = "ERROR"
                self._error = str(exc)

    def process(self, frame: np.ndarray) -> tuple[np.ndarray, list[dict[str, Any]], float]:
        with self._lock:
            model = self._model
            state = self._state

        if state != "READY" or model is None:
            return frame, [], 0.0

        started = time.perf_counter()
        try:
            results = model.predict(
                source=frame,
                classes=list(self.settings.target_classes),
                conf=self.settings.confidence,
                imgsz=self.settings.image_size,
                device=self.settings.device,
                verbose=False,
            )
            result = results[0]
            detections: list[dict[str, Any]] = []
            if result.boxes is not None:
                boxes = result.boxes.xyxy.cpu().tolist()
                confidences = result.boxes.conf.cpu().tolist()
                class_ids = result.boxes.cls.cpu().tolist()
                for box, confidence, class_id in zip(boxes, confidences, class_ids):
                    numeric_class_id = int(class_id)
                    detections.append(
                        {
                            "classId": numeric_class_id,
                            "label": str(result.names.get(numeric_class_id, numeric_class_id)),
                            "confidence": round(float(confidence), 4),
                            "box": [round(float(value), 1) for value in box],
                        }
                    )
            annotated = result.plot(labels=True, conf=True, boxes=True)
            elapsed_ms = (time.perf_counter() - started) * 1000
            return annotated, detections, elapsed_ms
        except Exception as exc:
            with self._lock:
                self._state = "ERROR"
                self._error = str(exc)
            return frame, [], 0.0

    def status(self) -> dict[str, Any]:
        with self._lock:
            return {
                "state": self._state,
                "model": self.settings.model_path,
                "device": self.settings.device,
                "targetClassIds": list(self.settings.target_classes),
                "confidenceThreshold": self.settings.confidence,
                "error": self._error,
            }
