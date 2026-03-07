from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[4]


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
    DATABASE_URL: str = "postgresql+asyncpg://groundup:devpassword@localhost:5433/groundup"

    # Dataset and media assets
    DATASET_DIR: Path = Field(default=REPO_ROOT.parent / "extracted_data" / "Fullstack Test")
    DATASET_FILE: str = "Test Dataset.xlsx"
    SERVER_DATA_DIR: Path = Field(default=REPO_ROOT / "apps" / "server" / "data")
    AUDIO_DIR: Path = Field(default=REPO_ROOT / "apps" / "server" / "data" / "audio")
    SPECTROGRAM_DIR: Path = Field(default=REPO_ROOT / "apps" / "server" / "data" / "spectrograms")

    # Environment
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
