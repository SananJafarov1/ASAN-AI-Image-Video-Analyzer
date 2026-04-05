"""YOLOv8 object/damage detection service."""
from __future__ import annotations

import io
from pathlib import Path
from typing import Any

from PIL import Image

from config import get_settings

settings = get_settings()

# Minimum confidence to include a detection (filters false positives)
CONFIDENCE_THRESHOLD = 0.45

# Map YOLO class names → Azerbaijani label + priority weight + is_damage flag
# Only classes with is_damage=True contribute to priority scoring.
# Normal objects (is_damage=False) are detected and labeled but don't inflate priority.
DAMAGE_PRIORITY_MAP: dict[str, dict[str, Any]] = {
    # Infrastructure damage — these affect priority
    "pothole":          {"label": "Çala",               "priority_weight": 3, "is_damage": True},
    "crack":            {"label": "Çat",                "priority_weight": 2, "is_damage": True},
    "flood":            {"label": "Su basması",         "priority_weight": 3, "is_damage": True},
    "fire":             {"label": "Yanğın",             "priority_weight": 4, "is_damage": True},
    "gas_leak":         {"label": "Qaz sızması",        "priority_weight": 4, "is_damage": True},
    "broken_pipe":      {"label": "Qırıq boru",         "priority_weight": 3, "is_damage": True},
    "damaged_sidewalk": {"label": "Zədəli səki",        "priority_weight": 2, "is_damage": True},
    "graffiti":         {"label": "Qraffiti",           "priority_weight": 1, "is_damage": True},
    "trash":            {"label": "Zibil",              "priority_weight": 2, "is_damage": True},
    "broken_streetlight":{"label": "Qırıq işıq dirəyi","priority_weight": 2, "is_damage": True},
    "water_puddle":     {"label": "Su gölməçəsi",       "priority_weight": 2, "is_damage": True},
    # COCO general classes (yolov8n detects these) — do NOT affect priority
    "person":           {"label": "İnsan",              "priority_weight": 0, "is_damage": False},
    "car":              {"label": "Avtomobil",           "priority_weight": 0, "is_damage": False},
    "truck":            {"label": "Yük maşını",         "priority_weight": 0, "is_damage": False},
    "bus":              {"label": "Avtobus",            "priority_weight": 0, "is_damage": False},
    "motorcycle":       {"label": "Motosiklet",         "priority_weight": 0, "is_damage": False},
    "bicycle":          {"label": "Velosiped",          "priority_weight": 0, "is_damage": False},
    "traffic light":    {"label": "Svetofor",           "priority_weight": 0, "is_damage": False},
    "stop sign":        {"label": "Dayanma işarəsi",   "priority_weight": 0, "is_damage": False},
    "bench":            {"label": "Skamya",             "priority_weight": 0, "is_damage": False},
    "tree":             {"label": "Ağac",               "priority_weight": 0, "is_damage": False},
    "road":             {"label": "Yol",                "priority_weight": 0, "is_damage": False},
    "building":         {"label": "Bina",               "priority_weight": 0, "is_damage": False},
    "dog":              {"label": "It",                 "priority_weight": 0, "is_damage": False},
    "cat":              {"label": "Pişik",              "priority_weight": 0, "is_damage": False},
    "bird":             {"label": "Quş",                "priority_weight": 0, "is_damage": False},
    "boat":             {"label": "Qayıq",              "priority_weight": 0, "is_damage": False},
    "fire hydrant":     {"label": "Yanğın kranı",      "priority_weight": 0, "is_damage": False},
    "backpack":         {"label": "Bel çantası",        "priority_weight": 0, "is_damage": False},
    "umbrella":         {"label": "Çətir",              "priority_weight": 0, "is_damage": False},
    "chair":            {"label": "Stul",               "priority_weight": 0, "is_damage": False},
    "bottle":           {"label": "Şüşə",              "priority_weight": 0, "is_damage": False},
}


def _load_model():
    """Lazy-load YOLOv8 to avoid import at startup if not available."""
    try:
        from ultralytics import YOLO  # type: ignore
        model_path = settings.yolo_model_path
        return YOLO(model_path)
    except Exception as exc:
        raise RuntimeError(f"Failed to load YOLO model: {exc}") from exc


_model = None


def get_model():
    global _model
    if _model is None:
        _model = _load_model()
    return _model


def detect(image_bytes: bytes) -> dict[str, Any]:
    """
    Run YOLOv8 inference on raw image bytes.

    Returns
    -------
    {
        "objects": [{"class": str, "label_az": str, "confidence": float, "bbox": [x1,y1,x2,y2]}],
        "max_priority_weight": int,
        "top_damage_class": str | None,
    }
    """
    model = get_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model(image, verbose=False)
    detections: list[dict[str, Any]] = []

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            cls_name = result.names[cls_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            if conf < CONFIDENCE_THRESHOLD:
                continue
            meta = DAMAGE_PRIORITY_MAP.get(cls_name, {"label": cls_name, "priority_weight": 0, "is_damage": False})
            detections.append({
                "class": cls_name,
                "label_az": meta["label"],
                "confidence": round(conf, 3),
                "bbox": [round(x1), round(y1), round(x2), round(y2)],
                "priority_weight": meta["priority_weight"],
                "is_damage": meta["is_damage"],
            })

    # Only damage classes contribute to priority scoring
    damage_detections = [d for d in detections if d["is_damage"]]
    damage_detections.sort(key=lambda d: d["priority_weight"], reverse=True)
    detections.sort(key=lambda d: d["priority_weight"], reverse=True)
    max_weight = damage_detections[0]["priority_weight"] if damage_detections else 0
    top_class = damage_detections[0]["class"] if damage_detections else None

    return {
        "objects": detections,
        "max_priority_weight": max_weight,
        "top_damage_class": top_class,
    }
