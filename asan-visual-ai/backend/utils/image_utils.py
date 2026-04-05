"""Image validation, normalization, EXIF GPS extraction, video frame extraction."""
from __future__ import annotations

import io
from typing import Tuple

import httpx
from PIL import Image, ExifTags
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_DIMENSION = 1024  # resize long edge to this


def validate_and_normalize(
    data: bytes, content_type: str
) -> Tuple[bytes, str]:
    """
    Validate and normalize incoming media.
    - For images: resize to MAX_DIMENSION long-edge, convert to JPEG.
    - For video: extract first frame and treat as image.
    Returns (jpeg_bytes, "image/jpeg").
    """
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError(f"File too large (max {MAX_IMAGE_BYTES // 1024 // 1024} MB)")

    if content_type.startswith("video/"):
        data = _extract_first_frame(data)

    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc

    # Resize if necessary
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue(), "image/jpeg"


def _extract_first_frame(video_bytes: bytes) -> bytes:
    """Extract the first frame from a video using OpenCV."""
    try:
        import cv2  # type: ignore
        import numpy as np

        arr = np.frombuffer(video_bytes, dtype=np.uint8)
        cap = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if cap is None:
            # Try writing to temp file
            import tempfile, os
            suffix = ".mp4"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name
            cap = cv2.VideoCapture(tmp_path)
            ret, frame = cap.read()
            cap.release()
            os.unlink(tmp_path)
            if not ret:
                raise ValueError("Could not read video frame")
        else:
            frame = cap

        _, buf = cv2.imencode(".jpg", frame)
        return buf.tobytes()
    except ImportError:
        raise ValueError("OpenCV not available for video processing")


def extract_exif_gps(image_bytes: bytes) -> str | None:
    """Return GPS string from EXIF data, or None if not present."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_data = img._getexif()  # type: ignore[attr-defined]
        if not exif_data:
            return None

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = ExifTags.TAGS.get(tag_id)
            if tag == "GPSInfo":
                gps_info = value
                break

        if not gps_info:
            return None

        def to_decimal(coords, ref):
            d, m, s = coords
            decimal = float(d) + float(m) / 60 + float(s) / 3600
            if ref in ("S", "W"):
                decimal *= -1
            return decimal

        lat = to_decimal(
            gps_info.get(2, (0, 0, 0)),
            gps_info.get(1, "N"),
        )
        lon = to_decimal(
            gps_info.get(4, (0, 0, 0)),
            gps_info.get(3, "E"),
        )
        return f"GPS: {lat:.6f}, {lon:.6f}"
    except Exception:
        return None


def extract_exif_gps_coords(image_bytes: bytes) -> tuple[float, float] | None:
    """Return (lat, lon) floats from EXIF data, or None if not present."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_data = img._getexif()  # type: ignore[attr-defined]
        if not exif_data:
            return None

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = ExifTags.TAGS.get(tag_id)
            if tag == "GPSInfo":
                gps_info = value
                break

        if not gps_info:
            return None

        def to_decimal(coords, ref):
            d, m, s = coords
            decimal = float(d) + float(m) / 60 + float(s) / 3600
            if ref in ("S", "W"):
                decimal *= -1
            return decimal

        lat = to_decimal(gps_info.get(2, (0, 0, 0)), gps_info.get(1, "N"))
        lon = to_decimal(gps_info.get(4, (0, 0, 0)), gps_info.get(3, "E"))
        return (lat, lon)
    except Exception:
        return None


async def reverse_geocode(lat: float, lon: float) -> str | None:
    """Convert GPS coordinates to a clean road-level address using Nominatim."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "accept-language": "az",
                    "addressdetails": 1,
                    "zoom": 18,
                },
                headers={"User-Agent": "asan-visual-ai/1.0 (asanaihub@icenter.az)"},
            )
            response.raise_for_status()
            data = response.json()
            addr = data.get("address", {})

            parts = []
            road = addr.get("road") or addr.get("pedestrian") or addr.get("footway")
            if road:
                house = addr.get("house_number", "")
                parts.append(f"{road} {house}".strip())
            neighbourhood = (
                addr.get("neighbourhood")
                or addr.get("suburb")
                or addr.get("quarter")
                or addr.get("district")
            )
            if neighbourhood:
                parts.append(neighbourhood)
            city = addr.get("city") or addr.get("town") or addr.get("village")
            if city:
                parts.append(city)

            return ", ".join(parts) if parts else data.get("display_name")
    except Exception:
        return None
