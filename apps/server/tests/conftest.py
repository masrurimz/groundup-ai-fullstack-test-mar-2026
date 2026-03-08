import math
import shutil
import wave
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.services.storage as storage_module
from app.core.db import get_session
from app.main import app
from app.models import Action, Alert, Base, Machine, Reason, Sensor

TEST_DATABASE_URL = "postgresql+asyncpg://groundup:devpassword@localhost:5433/groundup_test"


def _create_test_wav(
    path: Path, *, duration_seconds: float = 0.25, sample_rate: int = 8000
) -> None:
    n_samples = int(duration_seconds * sample_rate)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(n_samples):
            value = int(32767 * 0.5 * math.sin(2 * math.pi * 440 * i / sample_rate))
            wav_file.writeframesraw(value.to_bytes(2, byteorder="little", signed=True))


class MockS3Storage:
    def __init__(self, tmp_path: Path) -> None:
        self._files: set[str] = set()
        self._tmp_path = tmp_path
        self._wav_path = tmp_path / "mock.wav"
        _create_test_wav(self._wav_path)

    def seed_key(self, key: str) -> None:
        self._files.add(key)

    def file_exists(self, key: str) -> bool:
        return key in self._files

    def upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        self._files.add(key)

    def upload_file(self, key: str, path: Path, content_type: str) -> None:
        self._files.add(key)

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return f"http://fake-s3/{key}"

    def download_to_tempfile(self, key: str) -> Path:
        dest = self._tmp_path / f"dl_{key.replace('/', '_')}"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(self._wav_path, dest)
        return dest

    async def async_file_exists(self, key: str) -> bool:
        return key in self._files

    async def async_generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return f"http://fake-s3/{key}"

    async def async_upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        self._files.add(key)

    async def async_download_to_tempfile(self, key: str) -> Path:
        dest = self._tmp_path / f"dl_{key.replace('/', '_')}"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(self._wav_path, dest)
        return dest


@pytest.fixture
async def test_client(tmp_path: Path) -> AsyncGenerator[AsyncClient]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    mock_storage = MockS3Storage(tmp_path)
    mock_storage.seed_key("audio/1.wav")

    async with session_factory() as session:
        cnc_machine = Machine(
            key="cnc machine",
            name="CNC Machine",
            is_active=True,
            created_at=datetime.fromtimestamp(1628676001, tz=UTC),
            updated_at=datetime.fromtimestamp(1628676001, tz=UTC),
        )
        milling_machine = Machine(
            key="milling machine",
            name="Milling Machine",
            is_active=True,
            created_at=datetime.fromtimestamp(1629058322, tz=UTC),
            updated_at=datetime.fromtimestamp(1629058322, tz=UTC),
        )
        session.add_all([cnc_machine, milling_machine])
        await session.flush()

        cnc_sensor = Sensor(
            machine_id=cnc_machine.id,
            serial="1234567890",
            name="Sensor 1234567890",
            key="1234567890",
            is_active=True,
            created_at=datetime.fromtimestamp(1628676001, tz=UTC),
            updated_at=datetime.fromtimestamp(1628676001, tz=UTC),
        )
        milling_sensor = Sensor(
            machine_id=milling_machine.id,
            serial="9876543210",
            name="Sensor 9876543210",
            key="9876543210",
            is_active=True,
            created_at=datetime.fromtimestamp(1629058322, tz=UTC),
            updated_at=datetime.fromtimestamp(1629058322, tz=UTC),
        )
        session.add_all([cnc_sensor, milling_sensor])
        await session.flush()

        spindle_reason = Reason(
            machine_id=cnc_machine.id,
            key="spindle error",
            reason="Spindle Error",
            is_active=True,
            created_at=datetime.fromtimestamp(1628676001, tz=UTC),
            updated_at=datetime.fromtimestamp(1628676001, tz=UTC),
        )
        crash_reason = Reason(
            machine_id=milling_machine.id,
            key="machine crash",
            reason="Machine Crash",
            is_active=True,
            created_at=datetime.fromtimestamp(1629058322, tz=UTC),
            updated_at=datetime.fromtimestamp(1629058322, tz=UTC),
        )
        immediate_action = Action(
            key="immediate",
            action="Immediate",
            is_active=True,
            created_at=datetime.fromtimestamp(1628676001, tz=UTC),
            updated_at=datetime.fromtimestamp(1628676001, tz=UTC),
        )
        later_action = Action(
            key="later",
            action="Later",
            is_active=True,
            created_at=datetime.fromtimestamp(1629058322, tz=UTC),
            updated_at=datetime.fromtimestamp(1629058322, tz=UTC),
        )
        session.add_all([spindle_reason, crash_reason, immediate_action, later_action])
        await session.flush()

        session.add_all(
            [
                Alert(
                    timestamp=datetime.fromtimestamp(1628676001, tz=UTC),
                    machine="CNC Machine",
                    machine_id=cnc_machine.id,
                    anomaly_type="Mild",
                    sensor="1234567890",
                    sensor_id=cnc_sensor.id,
                    sound_clip="1.wav",
                    suspected_reason=None,
                    suspected_reason_id=None,
                    action=None,
                    action_id=None,
                    comment=None,
                    updated_at=None,
                    updated_by=None,
                ),
                Alert(
                    timestamp=datetime.fromtimestamp(1629058322, tz=UTC),
                    machine="Milling Machine",
                    machine_id=milling_machine.id,
                    anomaly_type="Severe",
                    sensor="9876543210",
                    sensor_id=milling_sensor.id,
                    sound_clip="1.wav",
                    suspected_reason=None,
                    suspected_reason_id=None,
                    action=None,
                    action_id=None,
                    comment=None,
                    updated_at=None,
                    updated_by=None,
                ),
            ]
        )
        await session.commit()

    async def override_get_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        with (
            patch("app.api.routes.alerts.storage", mock_storage),
            patch.object(storage_module, "storage", mock_storage),
        ):
            yield client

    app.dependency_overrides.clear()
    await engine.dispose()
