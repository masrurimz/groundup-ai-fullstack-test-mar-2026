import os
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GroundUp AI API"

    # CORS Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Database Configuration
    DATABASE_URL: str = (
        "postgresql+asyncpg://groundup:devpassword@localhost:5433/groundup"
    )

    # Environment
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
