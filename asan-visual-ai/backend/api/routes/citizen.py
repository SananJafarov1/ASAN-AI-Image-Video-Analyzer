"""POST /api/analyze — citizen uploads photo/video for AI analysis."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.deps import get_db
from models.request import CitizenRequest, CategoryEnum, PriorityEnum, StatusEnum
from services import yolo_service, vision_service, priority_service, storage_service
from utils.image_utils import validate_and_normalize, extract_exif_gps_coords, reverse_geocode

router = APIRouter()


@router.post("/analyze", status_code=status.HTTP_201_CREATED)
async def analyze(
    file: UploadFile = File(...),
    manual_location: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept a citizen-uploaded image or video.
    Run YOLO + GPT-4 Vision pipeline and return structured analysis in Azerbaijani.
    """
    raw = await file.read()
    content_type = file.content_type or "image/jpeg"

    # Normalize image (resize, convert video frame, validate)
    try:
        image_bytes, mime = validate_and_normalize(raw, content_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Extract GPS from EXIF and reverse-geocode to readable address
    # Must use raw bytes — PIL strips EXIF when saving normalized JPEG
    coords = extract_exif_gps_coords(raw)
    gps_address = None
    if coords:
        gps_address = await reverse_geocode(coords[0], coords[1])
        if not gps_address:
            gps_address = f"GPS: {coords[0]:.6f}, {coords[1]:.6f}"

    # 1. YOLO detection
    yolo_result = yolo_service.detect(image_bytes)
    detected_labels_az = [d["label_az"] for d in yolo_result["objects"]]
    detected_objects = detected_labels_az

    # 2. GPT-4 Vision analysis — pass GPS address so GPT can combine with visual cues
    try:
        gpt_result = await vision_service.analyze_image(image_bytes, detected_labels_az, gps_address=gps_address)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Vision API error: {exc}")

    # 3. Priority scoring
    has_problem = gpt_result.get("has_problem", True)
    final_priority = priority_service.compute_priority(
        yolo_max_weight=yolo_result["max_priority_weight"],
        gpt_priority=gpt_result.get("priority"),
        has_problem=has_problem,
    )

    # 4. Store image
    image_key = storage_service.upload_bytes(image_bytes, content_type=mime)

    # 5. Persist to DB
    req = CitizenRequest(
        original_image_key=image_key,
        description_az=gpt_result.get("description_az"),
        category=gpt_result.get("category", CategoryEnum.diger),
        priority=final_priority,
        detected_objects=detected_objects,
        confidence=yolo_result["objects"][0]["confidence"] if yolo_result["objects"] else None,
        location_hint=manual_location or gpt_result.get("location_hint") or gps_address,
        yolo_raw=yolo_result,
        status=StatusEnum.routed,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    return {
        "request_id": req.id,
        "description_az": req.description_az,
        "category": req.category,
        "priority": req.priority,
        "has_problem": has_problem,
        "detected_objects": detected_objects,
        "confidence": req.confidence,
        "location_hint": req.location_hint,
        "status": req.status,
    }


@router.get("/requests/{request_id}")
async def get_request(request_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CitizenRequest).where(CitizenRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req
