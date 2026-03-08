from datetime import UTC, date, datetime, time
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException
from fastapi import Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.models import Alert
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
