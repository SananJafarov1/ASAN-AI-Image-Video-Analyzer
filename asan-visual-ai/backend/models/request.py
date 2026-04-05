import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum as SAEnum
from sqlalchemy.orm import DeclarativeBase
import enum


class Base(DeclarativeBase):
    pass


class CategoryEnum(str, enum.Enum):
    kommunal = "kommunal"
    yol_neqliyyat = "yol_neqliyyat"
    infrastruktur = "infrastruktur"
    ekoloji = "ekoloji"
    diger = "diger"


class PriorityEnum(str, enum.Enum):
    tecili = "tecili"
    orta = "orta"
    asagi = "asagi"


class StatusEnum(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    routed = "routed"
    resolved = "resolved"
    unresolved = "unresolved"


class CitizenRequest(Base):
    __tablename__ = "citizen_requests"

    id = Column(String, primary_key=True, default=lambda: f"req_{uuid.uuid4().hex[:8]}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Original upload
    original_image_key = Column(String, nullable=False)   # S3/MinIO object key
    original_image_url = Column(String, nullable=True)

    # AI analysis outputs
    description_az = Column(String, nullable=True)
    category = Column(SAEnum(CategoryEnum), nullable=True)
    priority = Column(SAEnum(PriorityEnum), nullable=True)
    detected_objects = Column(JSON, default=list)
    confidence = Column(Float, nullable=True)
    location_hint = Column(String, nullable=True)
    yolo_raw = Column(JSON, nullable=True)           # full YOLO result

    # Verification
    status = Column(SAEnum(StatusEnum), default=StatusEnum.pending)
    result_image_key = Column(String, nullable=True)
    result_image_url = Column(String, nullable=True)
    similarity_score = Column(Float, nullable=True)
    resolved = Column(String, nullable=True)         # "true" / "false"
    mismatch_reason = Column(String, nullable=True)
