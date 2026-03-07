import shutil
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Action, Alert, Reason
from app.services.media import generate_spectrogram


def _dataset_file() -> Path:
    return settings.DATASET_DIR / settings.DATASET_FILE


def _normalize_sensor(value: object) -> str:
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return str(int(value))
    return str(value)


def copy_wav_files() -> None:
    settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for wav_file in settings.DATASET_DIR.glob("*.wav"):
        destination = settings.AUDIO_DIR / wav_file.name
        if not destination.exists():
            shutil.copy2(wav_file, destination)


async def seed_lookup_data(session: AsyncSession) -> None:
    reasons_existing = await session.execute(select(Reason.id).limit(1))
    if reasons_existing.scalar_one_or_none() is None:
        reasons_data = [
            {"machine": "CNC Machine", "reason": "Spindle Error"},
            {"machine": "CNC Machine", "reason": "Axis Problem"},
            {"machine": "CNC Machine", "reason": "Normal"},
            {"machine": "Milling Machine", "reason": "Machine Crash"},
            {"machine": "Milling Machine", "reason": "Router Fault"},
            {"machine": "Milling Machine", "reason": "Normal"},
        ]
        for item in reasons_data:
            session.add(Reason(machine=item["machine"], reason=item["reason"]))

    actions_existing = await session.execute(select(Action.id).limit(1))
    if actions_existing.scalar_one_or_none() is None:
        for action_name in ["Immediate", "Later", "No Action"]:
            session.add(Action(action=action_name))

    await session.commit()


async def seed_alerts(session: AsyncSession) -> None:
    existing = await session.execute(select(Alert.id).limit(1))
    if existing.scalar_one_or_none() is not None:
        return

    dataset = _dataset_file()
    if not dataset.exists():
        return

    df = pd.read_excel(dataset)
    for _, row in df.iterrows():
        timestamp = datetime.fromtimestamp(int(row["Timestamp"]), tz=UTC)
        session.add(
            Alert(
                timestamp=timestamp,
                machine=str(row["Machine"]),
                anomaly_type=str(row["Anomaly"]),
                sensor=_normalize_sensor(row["Sensor"]),
                sound_clip=str(row["soundClip"]),
                suspected_reason=None,
                action=None,
                comment=None,
            )
        )

    await session.commit()


async def ensure_spectrograms(session: AsyncSession) -> None:
    settings.SPECTROGRAM_DIR.mkdir(parents=True, exist_ok=True)
    result = await session.execute(select(Alert.id, Alert.sound_clip))
    for alert_id, sound_clip in result.all():
        target_png = settings.SPECTROGRAM_DIR / f"{alert_id}.png"
        source_wav = settings.AUDIO_DIR / sound_clip
        if target_png.exists() or not source_wav.exists():
            continue
        generate_spectrogram(source_wav, target_png)


async def bootstrap_data(session: AsyncSession) -> None:
    copy_wav_files()
    await seed_lookup_data(session)
    await seed_alerts(session)
    await ensure_spectrograms(session)
