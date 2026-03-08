import json
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GroundUp AI API"

    # CORS Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://groundup:devpassword@localhost:5433/groundup"

    # Dataset and media assets
    DATASET_DIR: Path = Field(default=REPO_ROOT.parent / "extracted_data" / "Fullstack Test")
    DATASET_FILE: str = "Test Dataset.xlsx"
    # S3-compatible storage (RustFS)
    S3_ENDPOINT: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"

    # Environment
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, enable_decoding=False)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                return json.loads(stripped)
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return value


settings = Settings()
