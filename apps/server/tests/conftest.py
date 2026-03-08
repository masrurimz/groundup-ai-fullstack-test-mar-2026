import math
import wave
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.db import get_session
from app.main import app
from app.models import Action, Alert, Base, Machine, Reason


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


@pytest.fixture
async def test_client(tmp_path: Path) -> AsyncGenerator[AsyncClient]:
    db_path = tmp_path / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    audio_dir = tmp_path / "audio"
    spectrogram_dir = tmp_path / "spectrograms"
    _create_test_wav(audio_dir / "1.wav")

    settings.AUDIO_DIR = audio_dir
    settings.SPECTROGRAM_DIR = spectrogram_dir

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
        yield client

    app.dependency_overrides.clear()
    await engine.dispose()
