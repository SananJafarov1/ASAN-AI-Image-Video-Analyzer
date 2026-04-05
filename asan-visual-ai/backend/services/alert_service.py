"""Alert generation and persistence service."""
from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.alert import Alert, AlertTypeEnum, SeverityEnum
from config import get_settings

settings = get_settings()


def _build_alert(
    request_id: str,
    alert_type: AlertTypeEnum,
    severity: SeverityEnum,
    message_az: str,
) -> Alert:
    return Alert(
        request_id=request_id,
        alert_type=alert_type,
        severity=severity,
        message_az=message_az,
    )


async def create_verification_alerts(
    db: AsyncSession,
    request_id: str,
    similarity_score: float,
    same_location: bool,
    damage_still_present: bool,
    top_damage_class: str | None,
) -> list[Alert]:
    """Evaluate verification results and create alerts as needed."""
    alerts: list[Alert] = []
    threshold = settings.clip_similarity_threshold

    if not same_location:
        alert = _build_alert(
            request_id=request_id,
            alert_type=AlertTypeEnum.wrong_location,
            severity=SeverityEnum.high,
            message_az=(
                "Nəticə şəkli fərqli bir yerdən yüklənmiş ola bilər. "
                f"CLIP oxşarlıq balı: {similarity_score:.2f} (hədd: {threshold})."
            ),
        )
        alerts.append(alert)

    if similarity_score < threshold and same_location:
        alert = _build_alert(
            request_id=request_id,
            alert_type=AlertTypeEnum.low_similarity,
            severity=SeverityEnum.medium,
            message_az=(
                f"Nəticə şəkli ilkin müraciətlə kifayət qədər oxşar deyil "
                f"(bal: {similarity_score:.2f}). Problemin həll edilib-edilmədiyini yoxlayın."
            ),
        )
        alerts.append(alert)

    if damage_still_present and top_damage_class:
        alert = _build_alert(
            request_id=request_id,
            alert_type=AlertTypeEnum.damage_still_detected,
            severity=SeverityEnum.high,
            message_az=(
                f"Nəticə şəklində hələ də zədə aşkar edildi: '{top_damage_class}'. "
                "Problem tam həll edilməmiş ola bilər."
            ),
        )
        alerts.append(alert)

    for a in alerts:
        db.add(a)
    await db.commit()
    return alerts


async def get_all_alerts(db: AsyncSession) -> list[Alert]:
    result = await db.execute(
        select(Alert).where(Alert.acknowledged == False).order_by(Alert.created_at.desc())
    )
    return result.scalars().all()


async def acknowledge_alert(db: AsyncSession, alert_id: str) -> Alert | None:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.acknowledged = True
        await db.commit()
    return alert
