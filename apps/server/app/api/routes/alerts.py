from datetime import UTC, date, datetime, time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.models import Action, Alert, AuditLog, Reason
from app.schemas import AlertResponse, AlertUpdateRequest, WaveformResponse
from app.services.media import generate_spectrogram, generate_waveform

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

    before = {
        "suspected_reason_id": alert.suspected_reason_id,
        "suspected_reason": alert.suspected_reason,
        "action_id": alert.action_id,
        "action": alert.action,
        "comment": alert.comment,
    }

    if "suspected_reason_id" in body.model_fields_set:
        if body.suspected_reason_id is None:
            alert.suspected_reason_id = None
            alert.suspected_reason = None
        else:
            reason = (
                await session.execute(select(Reason).where(Reason.id == body.suspected_reason_id))
            ).scalar_one_or_none()
            if reason is None:
                raise HTTPException(status_code=404, detail="reason not found")
            if not reason.is_active:
                raise HTTPException(status_code=400, detail="reason is inactive")
            if alert.machine_id is not None and reason.machine_id != alert.machine_id:
                raise HTTPException(
                    status_code=400,
                    detail="reason does not belong to alert machine",
                )
            alert.suspected_reason_id = reason.id
            alert.suspected_reason = reason.reason

    if "action_id" in body.model_fields_set:
        if body.action_id is None:
            alert.action_id = None
            alert.action = None
        else:
            action = (
                await session.execute(select(Action).where(Action.id == body.action_id))
            ).scalar_one_or_none()
            if action is None:
                raise HTTPException(status_code=404, detail="action not found")
            if not action.is_active:
                raise HTTPException(status_code=400, detail="action is inactive")
            alert.action_id = action.id
            alert.action = action.action

    if "comment" in body.model_fields_set:
        alert.comment = body.comment

    alert.updated_at = datetime.now(tz=UTC)
    alert.updated_by = "admin-ui"

    session.add(
        AuditLog(
            entity_type="alert",
            entity_id=alert.id,
            operation="update",
            actor="admin-ui",
            before_json=before,
            after_json={
                "suspected_reason_id": alert.suspected_reason_id,
                "suspected_reason": alert.suspected_reason,
                "action_id": alert.action_id,
                "action": alert.action,
                "comment": alert.comment,
            },
            created_at=alert.updated_at,
        )
    )

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

    waveform = generate_waveform(audio_path)
    return WaveformResponse(
        alert_id=alert_id,
        sample_rate=waveform["sample_rate"],
        duration_seconds=waveform["duration_seconds"],
        times=waveform["times"],
        amplitudes=waveform["amplitudes"],
    )


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
        generate_spectrogram(Path(audio_path), Path(spectrogram_path))

    return FileResponse(
        path=str(spectrogram_path),
        media_type="image/png",
        filename=f"spectrogram_{alert_id}.png",
    )
