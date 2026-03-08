import math
import shutil
import wave
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Action, Alert, Machine, Reason, Sensor
from app.services.media import generate_spectrogram

DEV_SEED_SOUND_CLIP = "dev-seed.wav"

# Per-machine baseline WAV configs: machine_key -> (filename, frequency_hz, duration_seconds)
_BASELINE_CONFIGS: dict[str, tuple[str, float, float]] = {
    "cnc machine": ("baseline-cnc-machine.wav", 440.0, 4.0),
    "milling machine": ("baseline-milling-machine.wav", 330.0, 5.0),
}


def _dataset_file() -> Path:
    return settings.DATASET_DIR / settings.DATASET_FILE


def _normalize_sensor(value: object) -> str:
    return str(value).strip()


def _normalize_key(value: str) -> str:
    return " ".join(value.strip().split()).lower()


async def _ensure_machine(session: AsyncSession, machine_name: str) -> Machine:
    key = _normalize_key(machine_name)
    existing = (
        await session.execute(select(Machine).where(Machine.key == key))
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    now = datetime.now(tz=UTC)
    machine = Machine(
        key=key,
        name=machine_name,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(machine)
    await session.flush()
    return machine


async def _ensure_sensor(session: AsyncSession, machine: Machine, serial: str) -> Sensor:
    key = _normalize_key(serial)
    existing = (
        await session.execute(
            select(Sensor).where(Sensor.machine_id == machine.id, Sensor.key == key)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    now = datetime.now(tz=UTC)
    sensor = Sensor(
        machine_id=machine.id,
        serial=serial,
        name=f"Sensor {serial}",
        key=key,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(sensor)
    await session.flush()
    return sensor


def copy_wav_files() -> None:
    settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for wav_file in settings.DATASET_DIR.glob("*.wav"):
        destination = settings.AUDIO_DIR / wav_file.name
        if not destination.exists():
            shutil.copy2(wav_file, destination)
    _create_baseline_wavs()


def _create_baseline_wavs() -> None:
    """Create baseline WAV files in AUDIO_DIR for each known machine config."""
    settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for filename, freq, dur in _BASELINE_CONFIGS.values():
        path = settings.AUDIO_DIR / filename
        if not path.exists():
            _create_baseline_wav(path, frequency_hz=freq, duration_seconds=dur)


def _create_dev_seed_wav(
    path: Path, duration_seconds: float = 0.35, sample_rate: int = 16000
) -> None:
    _create_baseline_wav(
        path, frequency_hz=440.0, duration_seconds=duration_seconds, sample_rate=sample_rate
    )


def _create_baseline_wav(
    path: Path,
    frequency_hz: float = 440.0,
    duration_seconds: float = 4.0,
    sample_rate: int = 16000,
    amplitude: float = 0.35,
) -> None:
    """Generate a clean sine-wave WAV representing normal machine operation."""
    n_samples = int(duration_seconds * sample_rate)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(n_samples):
            sample = int(32767 * amplitude * math.sin(2 * math.pi * frequency_hz * i / sample_rate))
            wav_file.writeframesraw(sample.to_bytes(2, byteorder="little", signed=True))


async def seed_lookup_data(session: AsyncSession) -> None:
    reasons_existing = (await session.execute(select(Reason.id).limit(1))).scalar_one_or_none()
    actions_existing = (await session.execute(select(Action.id).limit(1))).scalar_one_or_none()

    machine_rows = [
        "CNC Machine",
        "Milling Machine",
    ]
    machine_by_name: dict[str, Machine] = {}
    for machine_name in machine_rows:
        machine_by_name[machine_name] = await _ensure_machine(session, machine_name)

    # Set baseline sound clip for each machine if not already set
    for machine_name, machine in machine_by_name.items():
        key = _normalize_key(machine_name)
        config = _BASELINE_CONFIGS.get(key)
        if config is not None and machine.baseline_sound_clip is None:
            machine.baseline_sound_clip = config[0]
            session.add(machine)

    if reasons_existing is None:
        reasons_data = [
            {"machine": "CNC Machine", "reason": "Spindle Error"},
            {"machine": "CNC Machine", "reason": "Axis Problem"},
            {"machine": "CNC Machine", "reason": "Normal"},
            {"machine": "Milling Machine", "reason": "Machine Crash"},
            {"machine": "Milling Machine", "reason": "Router Fault"},
            {"machine": "Milling Machine", "reason": "Normal"},
        ]
        now = datetime.now(tz=UTC)
        for item in reasons_data:
            machine = machine_by_name[item["machine"]]
            reason_name = item["reason"]
            session.add(
                Reason(
                    machine_id=machine.id,
                    key=_normalize_key(reason_name),
                    reason=reason_name,
                    is_active=True,
                    created_at=now,
                    updated_at=now,
                )
            )

    if actions_existing is None:
        now = datetime.now(tz=UTC)
        for action_name in ["Immediate", "Later", "No Action"]:
            session.add(
                Action(
                    key=_normalize_key(action_name),
                    action=action_name,
                    is_active=True,
                    created_at=now,
                    updated_at=now,
                )
            )

    await session.commit()


async def seed_alerts(session: AsyncSession) -> None:
    existing = await session.execute(select(Alert.id).limit(1))
    if existing.scalar_one_or_none() is not None:
        return

    dataset = _dataset_file()
    if not dataset.exists():
        return

    df = pd.read_excel(dataset, dtype={"Sensor": str})
    machine_rows = sorted({str(row["Machine"]) for _, row in df.iterrows()})
    machine_by_name: dict[str, Machine] = {}
    for machine_name in machine_rows:
        machine_by_name[machine_name] = await _ensure_machine(session, machine_name)

    for _, row in df.iterrows():
        timestamp = datetime.fromtimestamp(int(row["Timestamp"]), tz=UTC)
        machine_name = str(row["Machine"])
        serial = _normalize_sensor(row["Sensor"])
        sensor = await _ensure_sensor(session, machine_by_name[machine_name], serial)
        session.add(
            Alert(
                timestamp=timestamp,
                machine=machine_name,
                machine_id=machine_by_name[machine_name].id,
                anomaly_type=str(row["Anomaly"]),
                sensor=serial,
                sensor_id=sensor.id,
                sound_clip=str(row["soundClip"]),
                suspected_reason=None,
                suspected_reason_id=None,
                action=None,
                action_id=None,
                comment=None,
                updated_at=None,
                updated_by=None,
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


async def seed_dev_data(session: AsyncSession) -> None:
    """Seed deterministic dev-only records in addition to dataset rows."""
    existing = await session.execute(
        select(Alert.id).where(Alert.sound_clip == DEV_SEED_SOUND_CLIP).limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        return

    dev_wav = settings.AUDIO_DIR / DEV_SEED_SOUND_CLIP
    if not dev_wav.exists():
        _create_dev_seed_wav(dev_wav)

    machine = await _ensure_machine(session, "CNC Machine")
    now = datetime.now(tz=UTC)

    # Ensure dev sensors
    dev_sensors = {}
    for i, _ in enumerate(["Mild", "Moderate", "Severe"], start=1):
        serial = f"DEV-SENSOR-{i}"
        dev_sensors[serial] = await _ensure_sensor(session, machine, serial)

    for index, anomaly in enumerate(["Mild", "Moderate", "Severe"], start=1):
        session.add(
            Alert(
                timestamp=now,
                machine="CNC Machine",
                machine_id=machine.id,
                anomaly_type=anomaly,
                sensor=f"DEV-SENSOR-{index}",
                sensor_id=dev_sensors[f"DEV-SENSOR-{index}"].id,
                sound_clip=DEV_SEED_SOUND_CLIP,
                suspected_reason=None,
                suspected_reason_id=None,
                action=None,
                action_id=None,
                comment="Seeded by seed:dev",
                updated_at=None,
                updated_by=None,
            )
        )

    await session.commit()
    await ensure_spectrograms(session)


async def bootstrap_data(session: AsyncSession) -> None:
    copy_wav_files()
    await seed_lookup_data(session)
    await seed_alerts(session)
    await ensure_spectrograms(session)
