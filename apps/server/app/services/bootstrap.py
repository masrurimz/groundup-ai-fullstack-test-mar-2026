import io
import math
import wave
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Action, Alert, Machine, Reason, Sensor
from app.services.media import generate_spectrogram
from app.services.storage import storage

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


def upload_wav_files() -> None:
    for wav_file in settings.DATASET_DIR.glob("*.wav"):
        key = f"audio/{wav_file.name}"
        if not storage.file_exists(key):
            storage.upload_file(key, wav_file, "audio/wav")
    _upload_baseline_wavs()


def _upload_baseline_wavs() -> None:
    for filename, freq, dur in _BASELINE_CONFIGS.values():
        key = f"audio/{filename}"
        if not storage.file_exists(key):
            wav_bytes = _create_baseline_wav_bytes(frequency_hz=freq, duration_seconds=dur)
            storage.upload_bytes(key, wav_bytes, "audio/wav")


def _create_baseline_wav_bytes(
    frequency_hz: float = 440.0,
    duration_seconds: float = 4.0,
    sample_rate: int = 16000,
    amplitude: float = 0.35,
) -> bytes:
    """Generate a clean sine-wave WAV representing normal machine operation."""
    n_samples = int(duration_seconds * sample_rate)
    buf = io.BytesIO()
    with wave.open(buf, "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for i in range(n_samples):
            sample = int(32767 * amplitude * math.sin(2 * math.pi * frequency_hz * i / sample_rate))
            wav_file.writeframesraw(sample.to_bytes(2, byteorder="little", signed=True))
    return buf.getvalue()


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

    # Shift dataset timestamps (Aug 2021) to be recent.
    # We compute a delta so the latest dataset timestamp lands on yesterday,
    # preserving the relative ordering and time-of-day spread across all 6 rows.
    raw_timestamps = [
        datetime.fromtimestamp(int(row["Timestamp"]), tz=UTC) for _, row in df.iterrows()
    ]
    latest_original = max(raw_timestamps)
    yesterday_midnight = datetime.now(tz=UTC).replace(
        hour=0, minute=0, second=0, microsecond=0
    ) - timedelta(days=1)
    shift_delta = yesterday_midnight - latest_original

    for _, row in df.iterrows():
        original_ts = datetime.fromtimestamp(int(row["Timestamp"]), tz=UTC)
        timestamp = original_ts + shift_delta
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
    result = await session.execute(select(Alert.id, Alert.sound_clip))
    for alert_id, sound_clip in result.all():
        spec_key = f"spectrograms/{alert_id}.png"
        if storage.file_exists(spec_key):
            continue
        audio_key = f"audio/{sound_clip}"
        if not storage.file_exists(audio_key):
            continue
        tmp_wav = storage.download_to_tempfile(audio_key)
        try:
            png_bytes = generate_spectrogram(tmp_wav)
        finally:
            tmp_wav.unlink(missing_ok=True)
        storage.upload_bytes(spec_key, png_bytes, "image/png")


async def seed_dev_data(session: AsyncSession) -> None:
    """Seed deterministic dev-only records in addition to dataset rows."""
    existing = await session.execute(
        select(Alert.id).where(Alert.sound_clip == DEV_SEED_SOUND_CLIP).limit(1)
    )
    if existing.scalar_one_or_none() is not None:
        return

    dev_key = f"audio/{DEV_SEED_SOUND_CLIP}"
    if not storage.file_exists(dev_key):
        wav_bytes = _create_baseline_wav_bytes(
            frequency_hz=440.0, duration_seconds=0.35, sample_rate=16000
        )
        storage.upload_bytes(dev_key, wav_bytes, "audio/wav")

    cnc = await _ensure_machine(session, "CNC Machine")
    milling = await _ensure_machine(session, "Milling Machine")

    # Ensure sensors exist for both machines
    cnc_sensor = await _ensure_sensor(session, cnc, "DEV-SENSOR-1")
    milling_sensor = await _ensure_sensor(session, milling, "DEV-SENSOR-2")

    # Look up Action and Reason records seeded by seed_lookup_data()
    from app.models import Action, Reason  # noqa: PLC0415

    def _action(name: str) -> "Action | None":
        return action_map.get(_normalize_key(name))

    def _reason(name: str) -> "Reason | None":
        return reason_map.get(_normalize_key(name))

    action_rows = (await session.execute(select(Action))).scalars().all()
    action_map = {a.key: a for a in action_rows}
    reason_rows = (await session.execute(select(Reason))).scalars().all()
    reason_map = {r.key: r for r in reason_rows}

    now = datetime.now(tz=UTC)

    def _ts(days_ago: int, hour: int = 9) -> datetime:
        return (now - timedelta(days=days_ago)).replace(
            hour=hour, minute=0, second=0, microsecond=0
        )

    def _alert(
        machine: "Machine",
        sensor: "Sensor",
        machine_name: str,
        anomaly: str,
        ts: datetime,
        action_name: str | None = None,
        reason_name: str | None = None,
    ) -> Alert:
        act = _action(action_name) if action_name else None
        rsn = _reason(reason_name) if reason_name else None
        return Alert(
            timestamp=ts,
            machine=machine_name,
            machine_id=machine.id,
            anomaly_type=anomaly,
            sensor=sensor.serial,
            sensor_id=sensor.id,
            sound_clip=DEV_SEED_SOUND_CLIP,
            suspected_reason=rsn.reason if rsn else None,
            suspected_reason_id=rsn.id if rsn else None,
            action=act.action if act else None,
            action_id=act.id if act else None,
            comment="Seeded by seed:dev",
            updated_at=ts if act else None,
            updated_by="seed" if act else None,
        )

    # 18 alerts spread over ~13 days, 3 machines × severity levels, 3 resolved
    alerts = [
        # Day -13
        _alert(cnc, cnc_sensor, "CNC Machine", "Mild", _ts(13, 8)),
        _alert(milling, milling_sensor, "Milling Machine", "Moderate", _ts(13, 10)),
        # Day -10
        _alert(cnc, cnc_sensor, "CNC Machine", "Severe", _ts(10, 9), "Immediate", "Spindle Error"),
        _alert(milling, milling_sensor, "Milling Machine", "Mild", _ts(10, 11)),
        # Day -8
        _alert(cnc, cnc_sensor, "CNC Machine", "Moderate", _ts(8, 7)),
        _alert(milling, milling_sensor, "Milling Machine", "Severe", _ts(8, 14)),
        # Day -6
        _alert(cnc, cnc_sensor, "CNC Machine", "Mild", _ts(6, 8)),
        _alert(cnc, cnc_sensor, "CNC Machine", "Moderate", _ts(6, 16)),
        _alert(milling, milling_sensor, "Milling Machine", "Mild", _ts(6, 10)),
        # Day -4
        _alert(cnc, cnc_sensor, "CNC Machine", "Severe", _ts(4, 9), "Immediate", "Axis Problem"),
        _alert(milling, milling_sensor, "Milling Machine", "Moderate", _ts(4, 13)),
        # Day -2
        _alert(cnc, cnc_sensor, "CNC Machine", "Mild", _ts(2, 8)),
        _alert(
            milling,
            milling_sensor,
            "Milling Machine",
            "Severe",
            _ts(2, 10),
            "Later",
            "Machine Crash",
        ),
        _alert(cnc, cnc_sensor, "CNC Machine", "Moderate", _ts(2, 15)),
        # Day -1
        _alert(cnc, cnc_sensor, "CNC Machine", "Severe", _ts(1, 9)),
        _alert(milling, milling_sensor, "Milling Machine", "Mild", _ts(1, 10)),
        _alert(milling, milling_sensor, "Milling Machine", "Moderate", _ts(1, 14)),
        _alert(cnc, cnc_sensor, "CNC Machine", "Mild", _ts(1, 17)),
    ]
    for alert in alerts:
        session.add(alert)

    await session.commit()
    await ensure_spectrograms(session)


async def bootstrap_data(session: AsyncSession) -> None:
    upload_wav_files()
    await seed_lookup_data(session)
    await seed_alerts(session)
    await ensure_spectrograms(session)
