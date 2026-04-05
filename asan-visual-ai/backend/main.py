from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from api.routes import citizen, institution, alerts
from models.request import Base
from sqlalchemy.ext.asyncio import create_async_engine


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables
    engine = create_async_engine(
        settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
        echo=settings.app_env == "development",
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.state.engine = engine
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="ASAN Visual AI — Vətəndaş Müraciət Analiz Sistemi",
    description=(
        "AI-powered visual analysis layer for the ASAN müraciət citizen "
        "request management platform. Automatically classifies complaints, "
        "assigns priority, and verifies issue resolution using YOLO, "
        "GPT-4 Vision, and CLIP."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(citizen.router, prefix="/api", tags=["citizen"])
app.include_router(institution.router, prefix="/api", tags=["institution"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])


@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "env": settings.app_env}
