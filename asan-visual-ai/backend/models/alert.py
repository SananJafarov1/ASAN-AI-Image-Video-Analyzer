import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Enum as SAEnum
from models.request import Base
import enum


class AlertTypeEnum(str, enum.Enum):
    low_similarity = "low_similarity"
    damage_still_detected = "damage_still_detected"
    wrong_location = "wrong_location"
    no_result_uploaded = "no_result_uploaded"


class SeverityEnum(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=lambda: f"alt_{uuid.uuid4().hex[:8]}")
    created_at = Column(DateTime, default=datetime.utcnow)

    request_id = Column(String, nullable=False)
    alert_type = Column(SAEnum(AlertTypeEnum), nullable=False)
    severity = Column(SAEnum(SeverityEnum), default=SeverityEnum.medium)
    message_az = Column(String, nullable=False)
    acknowledged = Column(Boolean, default=False)
