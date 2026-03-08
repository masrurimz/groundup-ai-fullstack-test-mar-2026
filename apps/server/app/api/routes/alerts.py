from datetime import UTC, date, datetime, time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.models import Alert
from app.schemas import AlertResponse, AlertUpdateRequest, WaveformResponse
from app.services.media import ensure_spectrogram, generate_waveform_cached

router = APIRouter(prefix="/alerts", tags=["alerts"])


async def _get_alert_or_404(session: AsyncSession, alert_id: int) -> Alert:
    result = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    machine: str | None = None,
    anomaly: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    session: AsyncSession = Depends(get_session),
) -> list[Alert]:
    query = select(Alert).order_by(Alert.timestamp.desc(), Alert.id.desc())

    if machine is not None:
        query = query.where(Alert.machine == machine)
    if anomaly is not None:
        query = query.where(Alert.anomaly_type == anomaly)
    if start_date is not None:
        start_at = datetime.combine(start_date, time.min, tzinfo=UTC)
        query = query.where(Alert.timestamp >= start_at)
    if end_date is not None:
        end_at = datetime.combine(end_date, time.max, tzinfo=UTC)
        query = query.where(Alert.timestamp <= end_at)

    result = await session.execute(query)
    return list(result.scalars().all())


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    session: AsyncSession = Depends(get_session),
) -> Alert:
    return await _get_alert_or_404(session, alert_id)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    body: AlertUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> Alert:
    alert = await _get_alert_or_404(session, alert_id)

    update_data = body.model_dump(include=body.model_fields_set)
    for field, value in update_data.items():
        setattr(alert, field, value)

    await session.commit()
    await session.refresh(alert)
    return alert


@router.get("/{alert_id}/audio")
async def get_audio(
    alert_id: int,
    session: AsyncSession = Depends(get_session),
) -> FileResponse:
    alert = await _get_alert_or_404(session, alert_id)
    audio_path = settings.AUDIO_DIR / alert.sound_clip

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=str(audio_path),
        media_type="audio/wav",
        filename=alert.sound_clip,
    )


@router.get("/{alert_id}/waveform", response_model=WaveformResponse)
async def get_waveform(
    alert_id: int,
    session: AsyncSession = Depends(get_session),
) -> WaveformResponse:
    alert = await _get_alert_or_404(session, alert_id)
    audio_path = settings.AUDIO_DIR / alert.sound_clip

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    waveform = generate_waveform_cached(audio_path)
    return WaveformResponse(alert_id=alert_id, **waveform)


@router.get("/{alert_id}/spectrogram")
async def get_spectrogram(
    alert_id: int,
    session: AsyncSession = Depends(get_session),
) -> FileResponse:
    alert = await _get_alert_or_404(session, alert_id)
    spectrogram_path = settings.SPECTROGRAM_DIR / f"{alert_id}.png"

    if not spectrogram_path.exists():
        audio_path = settings.AUDIO_DIR / alert.sound_clip
        if not audio_path.exists():
            raise HTTPException(status_code=404, detail="Audio file not found")
        ensure_spectrogram(audio_path, spectrogram_path)

    return FileResponse(
        path=str(spectrogram_path),
        media_type="image/png",
        filename=f"spectrogram_{alert_id}.png",
    )
