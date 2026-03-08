import uuid
from datetime import UTC, date, datetime, time
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.models import Action, Alert, AuditLog, Machine, Reason
from app.schemas import AlertResponse, AlertUpdateRequest, WaveformResponse
from app.services.media import ensure_spectrogram, generate_waveform_cached

router = APIRouter(prefix="/alerts", tags=["alerts"])

AUDIO_CHUNK_SIZE = 1024 * 512


def _parse_range_header(range_header: str, file_size: int) -> tuple[int, int]:
    if not range_header.startswith("bytes="):
        raise HTTPException(status_code=416, detail="Invalid Range header")

    start_text, _, end_text = range_header.removeprefix("bytes=").partition("-")
    if not start_text:
        raise HTTPException(status_code=416, detail="Invalid Range header")

    try:
        start = int(start_text)
        end = int(end_text) if end_text else file_size - 1
    except ValueError as error:
        raise HTTPException(status_code=416, detail="Invalid Range header") from error

    end = min(end, file_size - 1)
    if start < 0 or start > end:
        raise HTTPException(
            status_code=416,
            detail="Range Not Satisfiable",
            headers={"Content-Range": f"bytes */{file_size}"},
        )

    return start, end


async def _iter_audio_bytes(path: Path, start: int, end: int):
    remaining = end - start + 1
    async with aiofiles.open(path, "rb") as audio_file:
        await audio_file.seek(start)
        while remaining > 0:
            read_size = min(AUDIO_CHUNK_SIZE, remaining)
            chunk = await audio_file.read(read_size)
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


async def _get_alert_or_404(session: AsyncSession, alert_id: uuid.UUID) -> Alert:
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
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Alert:
    return await _get_alert_or_404(session, alert_id)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: uuid.UUID,
    body: AlertUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> Alert:
    alert = await _get_alert_or_404(session, alert_id)

    before = {
        "suspected_reason_id": str(alert.suspected_reason_id)
        if alert.suspected_reason_id
        else None,
        "suspected_reason": alert.suspected_reason,
        "action_id": str(alert.action_id) if alert.action_id else None,
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
                "suspected_reason_id": str(alert.suspected_reason_id)
                if alert.suspected_reason_id
                else None,
                "suspected_reason": alert.suspected_reason,
                "action_id": str(alert.action_id) if alert.action_id else None,
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
    alert_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    alert = await _get_alert_or_404(session, alert_id)
    audio_path = settings.AUDIO_DIR / alert.sound_clip

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    file_size = audio_path.stat().st_size
    range_header = request.headers.get("range")

    if range_header:
        start, end = _parse_range_header(range_header, file_size)
        content_length = end - start + 1
        return StreamingResponse(
            _iter_audio_bytes(audio_path, start, end),
            status_code=206,
            media_type="audio/wav",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(content_length),
            },
        )

    return StreamingResponse(
        _iter_audio_bytes(audio_path, 0, file_size - 1),
        status_code=200,
        media_type="audio/wav",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
        },
    )


@router.get("/{alert_id}/waveform", response_model=WaveformResponse)
async def get_waveform(
    alert_id: uuid.UUID,
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
    alert_id: uuid.UUID,
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


async def _get_baseline_audio_path_or_404(session: AsyncSession, alert_id: uuid.UUID) -> Path:
    """Resolve alert -> machine -> baseline_sound_clip path, raising 404 at each step."""
    alert = await _get_alert_or_404(session, alert_id)
    if alert.machine_id is None:
        raise HTTPException(status_code=404, detail="Alert has no associated machine")
    result = await session.execute(select(Machine).where(Machine.id == alert.machine_id))
    machine = result.scalar_one_or_none()
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    if not machine.baseline_sound_clip:
        raise HTTPException(status_code=404, detail="No baseline audio available for this machine")
    audio_path = settings.AUDIO_DIR / machine.baseline_sound_clip
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Baseline audio file not found")
    return audio_path


@router.get("/{alert_id}/baseline/audio")
async def get_baseline_audio(
    alert_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    audio_path = await _get_baseline_audio_path_or_404(session, alert_id)
    file_size = audio_path.stat().st_size
    range_header = request.headers.get("range")

    if range_header:
        start, end = _parse_range_header(range_header, file_size)
        content_length = end - start + 1
        return StreamingResponse(
            _iter_audio_bytes(audio_path, start, end),
            status_code=206,
            media_type="audio/wav",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(content_length),
            },
        )

    return StreamingResponse(
        _iter_audio_bytes(audio_path, 0, file_size - 1),
        status_code=200,
        media_type="audio/wav",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
        },
    )


@router.get("/{alert_id}/baseline/waveform", response_model=WaveformResponse)
async def get_baseline_waveform(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> WaveformResponse:
    audio_path = await _get_baseline_audio_path_or_404(session, alert_id)
    waveform = generate_waveform_cached(audio_path)
    return WaveformResponse(alert_id=alert_id, **waveform)


@router.get("/{alert_id}/baseline/spectrogram")
async def get_baseline_spectrogram(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> FileResponse:
    audio_path = await _get_baseline_audio_path_or_404(session, alert_id)
    # Use a stable cache key: machine baseline doesn't change per-alert,
    # but we cache by alert so dev seeds (same machine, different alerts) get fast responses too.
    # Key on the wav filename for proper cache reuse across alerts on the same machine.
    clip_name = audio_path.stem
    spectrogram_path = settings.SPECTROGRAM_DIR / f"baseline_{clip_name}.png"
    if not spectrogram_path.exists():
        ensure_spectrogram(audio_path, spectrogram_path)
    return FileResponse(
        path=str(spectrogram_path),
        media_type="image/png",
        filename=f"baseline_spectrogram_{alert_id}.png",
    )
