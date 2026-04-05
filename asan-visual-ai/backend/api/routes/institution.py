"""POST /api/verify — institution uploads result image for similarity verification."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.deps import get_db, verify_api_key
from models.request import CitizenRequest, StatusEnum
from services import clip_service, yolo_service, alert_service, storage_service
from utils.image_utils import validate_and_normalize

router = APIRouter()


@router.post("/verify/{request_id}", dependencies=[Depends(verify_api_key)])
async def verify(
    request_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Institution uploads result image.
    Runs CLIP similarity check + YOLO damage re-detection.
    Returns resolution verdict.
    """
    # Load original request
    result = await db.execute(
        select(CitizenRequest).where(CitizenRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    raw = await file.read()
    content_type = file.content_type or "image/jpeg"

    try:
        result_bytes, mime = validate_and_normalize(raw, content_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Download original image
    try:
        original_bytes = storage_service.download_bytes(req.original_image_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch original image: {exc}")

    # 1. CLIP similarity
    clip_result = clip_service.compare(original_bytes, result_bytes)
    similarity_score = clip_result["similarity_score"]
    same_location = clip_result["same_location"]

    # 2. Check if images are too similar (nothing changed)
    from config import get_settings as _get_settings
    _settings = _get_settings()
    images_unchanged = similarity_score >= _settings.clip_high_similarity_threshold

    # 3. YOLO on result image to check if damage still present
    yolo_result = yolo_service.detect(result_bytes)
    original_top = (req.yolo_raw or {}).get("top_damage_class")
    result_top = yolo_result.get("top_damage_class")
    damage_still_present = (
        original_top is not None
        and result_top is not None
        and original_top == result_top
    )

    # 4. Determine resolution
    # If images are nearly identical (>0.95), nothing has changed → NOT resolved
    # If images are from different location (<0.75) → NOT resolved
    # Otherwise: same location + damage no longer detected → resolved
    if images_unchanged:
        resolved = False
    else:
        resolved = same_location and not damage_still_present

    mismatch_reason = None
    if not resolved:
        reasons = []
        if images_unchanged:
            reasons.append("Nəticə şəkli ilkin şəkillə demək olar ki, eynidir — heç bir dəyişiklik aşkar edilmədi")
        if not same_location and not images_unchanged:
            reasons.append("Nəticə şəkli fərqli bir yerdən ola bilər")
        if damage_still_present:
            reasons.append(f"Nəticə şəklində zədə hələ aşkar edilir: '{result_top}'")
        mismatch_reason = ". ".join(reasons)

    # 4. Persist result image
    result_key = storage_service.upload_bytes(result_bytes, content_type=mime)

    # 5. Update request record
    req.result_image_key = result_key
    req.similarity_score = similarity_score
    req.resolved = str(resolved).lower()
    req.mismatch_reason = mismatch_reason
    req.status = StatusEnum.resolved if resolved else StatusEnum.unresolved
    await db.commit()

    # 6. Create alerts if unresolved
    alert_triggered = False
    if not resolved:
        created_alerts = await alert_service.create_verification_alerts(
            db=db,
            request_id=request_id,
            similarity_score=similarity_score,
            same_location=same_location,
            damage_still_present=damage_still_present,
            top_damage_class=result_top,
        )
        alert_triggered = len(created_alerts) > 0

    message_az = (
        "Problem uğurla həll edildi."
        if resolved
        else "Nəticə şəkli ilkin müraciətdəki problemin aradan qaldırıldığını təsdiqləmir."
    )

    return {
        "request_id": request_id,
        "resolved": resolved,
        "similarity_score": similarity_score,
        "alert_triggered": alert_triggered,
        "mismatch_reason": mismatch_reason,
        "message_az": message_az,
    }
