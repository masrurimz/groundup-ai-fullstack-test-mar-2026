from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.core.db import AsyncSessionLocal
from app.services import bootstrap_data


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    async with AsyncSessionLocal() as session:
        await bootstrap_data(session)
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    cast(Any, CORSMiddleware),
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Mount versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Compatibility path for existing /health endpoint
@app.get("/health")
async def health_compat() -> dict[str, str]:
    """Compatibility endpoint for existing callers."""
    return {"status": "ok"}
