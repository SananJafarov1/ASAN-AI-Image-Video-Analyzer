"""GET /api/alerts — staff dashboard alert retrieval."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_db, verify_api_key
from services.alert_service import get_all_alerts, acknowledge_alert

router = APIRouter()


@router.get("/alerts", dependencies=[Depends(verify_api_key)])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    """Return all unacknowledged alerts for staff dashboard."""
    alerts = await get_all_alerts(db)
    return [
        {
            "id": a.id,
            "request_id": a.request_id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message_az": a.message_az,
            "created_at": a.created_at.isoformat(),
            "acknowledged": a.acknowledged,
        }
        for a in alerts
    ]


@router.patch("/alerts/{alert_id}/acknowledge", dependencies=[Depends(verify_api_key)])
async def ack_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Acknowledge (dismiss) an alert."""
    alert = await acknowledge_alert(db, alert_id)
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": alert.id, "acknowledged": True}
