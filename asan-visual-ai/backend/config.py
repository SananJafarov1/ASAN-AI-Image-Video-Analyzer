from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-pro-preview"

    # Database
    database_url: str = "postgresql://user:pass@localhost:5432/asan_db"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # MinIO / S3
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "asan-media"
    minio_secure: bool = False

    # CLIP
    clip_model: str = "openai/clip-vit-base-patch32"
    clip_similarity_threshold: float = 0.75
    clip_high_similarity_threshold: float = 0.95

    # YOLO
    yolo_model_path: str = "yolov8n.pt"

    # App
    app_env: str = "development"
    secret_key: str = "change-me-in-production"
    api_key: str = "institution-secret-key"

    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
