import asyncio
import json
import uuid
from datetime import UTC, date, datetime, time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Action, Alert, AuditLog, Machine, Reason
from app.schemas import AlertResponse, AlertUpdateRequest, WaveformResponse
from app.services.media import (
    generate_spectrogram,
    generate_waveform,
    get_waveform_from_cache,
    put_waveform_in_cache,
)
from app.services.storage import storage

router = APIRouter(prefix="/alerts", tags=["alerts"])


async def _get_alert_or_404(session: AsyncSession, alert_id: uuid.UUID) -> Alert:
    result = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


async def _get_baseline_audio_key_or_404(
    session: AsyncSession, alert_id: uuid.UUID
) -> tuple[str, str]:
    """Resolve alert -> machine -> baseline S3 key, raising 404 at each step.

    Returns (audio_key, sound_clip) where sound_clip is the non-None baseline filename.
    """
    alert = await _get_alert_or_404(session, alert_id)
    if alert.machine_id is None:
        raise HTTPException(status_code=404, detail="Alert has no associated machine")
    result = await session.execute(select(Machine).where(Machine.id == alert.machine_id))
    machine = result.scalar_one_or_none()
    if machine is None:
        raise HTTPException(status_code=404, detail="Machine not found")
    if not machine.baseline_sound_clip:
        raise HTTPException(status_code=404, detail="No baseline audio available for this machine")
    sound_clip: str = machine.baseline_sound_clip
    s3_key = f"audio/{sound_clip}"
    if not await storage.async_file_exists(s3_key):
        raise HTTPException(status_code=404, detail="Baseline audio file not found")
    return s3_key, sound_clip


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
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    alert = await _get_alert_or_404(session, alert_id)
    s3_key = f"audio/{alert.sound_clip}"
    if not await storage.async_file_exists(s3_key):
        raise HTTPException(status_code=404, detail="Audio file not found")
    url = await storage.async_generate_presigned_url(s3_key)
    return RedirectResponse(url=url, status_code=302)


@router.get("/{alert_id}/waveform", response_model=WaveformResponse)
async def get_waveform(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    alert = await _get_alert_or_404(session, alert_id)
    audio_key = f"audio/{alert.sound_clip}"
    json_key = f"waveforms/{alert.sound_clip}.json"

    # Tier 1: in-memory cache (no I/O)
    cached = get_waveform_from_cache(audio_key)
    if cached is not None:
        return JSONResponse(
            content=WaveformResponse(alert_id=alert_id, **cached).model_dump(mode="json"),
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # Tier 2: pre-computed JSON persisted in S3
    if await storage.async_file_exists(json_key):
        tmp = await storage.async_download_to_tempfile(json_key)
        try:
            waveform = json.loads(tmp.read_text())
        finally:
            tmp.unlink(missing_ok=True)
        put_waveform_in_cache(audio_key, waveform)
        return JSONResponse(
            content=WaveformResponse(alert_id=alert_id, **waveform).model_dump(mode="json"),
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # Tier 3: compute from WAV (cold path)
    if not await storage.async_file_exists(audio_key):
        raise HTTPException(status_code=404, detail="Audio file not found")
    tmp_path = await storage.async_download_to_tempfile(audio_key)
    try:
        waveform = await asyncio.to_thread(generate_waveform, tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)

    await storage.async_upload_bytes(json_key, json.dumps(waveform).encode(), "application/json")
    put_waveform_in_cache(audio_key, waveform)
    return JSONResponse(
        content=WaveformResponse(alert_id=alert_id, **waveform).model_dump(mode="json"),
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{alert_id}/spectrogram")
async def get_spectrogram(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    alert = await _get_alert_or_404(session, alert_id)
    spec_key = f"spectrograms/{alert_id}.png"
    if not await storage.async_file_exists(spec_key):
        audio_key = f"audio/{alert.sound_clip}"
        if not await storage.async_file_exists(audio_key):
            raise HTTPException(status_code=404, detail="Audio file not found")
        tmp_wav = await storage.async_download_to_tempfile(audio_key)
        try:
            png_bytes = generate_spectrogram(tmp_wav)
        finally:
            tmp_wav.unlink(missing_ok=True)
        await storage.async_upload_bytes(spec_key, png_bytes, "image/png")
    url = await storage.async_generate_presigned_url(spec_key)
    return RedirectResponse(url=url, status_code=302)


@router.get("/{alert_id}/baseline/audio")
async def get_baseline_audio(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    s3_key, _ = await _get_baseline_audio_key_or_404(session, alert_id)
    url = await storage.async_generate_presigned_url(s3_key)
    return RedirectResponse(url=url, status_code=302)


@router.get("/{alert_id}/baseline/waveform", response_model=WaveformResponse)
async def get_baseline_waveform(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    audio_key, sound_clip = await _get_baseline_audio_key_or_404(session, alert_id)
    json_key = f"waveforms/baseline_{sound_clip}.json"

    # Tier 1: in-memory cache (no I/O)
    cached = get_waveform_from_cache(audio_key)
    if cached is not None:
        return JSONResponse(
            content=WaveformResponse(alert_id=alert_id, **cached).model_dump(mode="json"),
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # Tier 2: pre-computed JSON persisted in S3
    if await storage.async_file_exists(json_key):
        tmp = await storage.async_download_to_tempfile(json_key)
        try:
            waveform = json.loads(tmp.read_text())
        finally:
            tmp.unlink(missing_ok=True)
        put_waveform_in_cache(audio_key, waveform)
        return JSONResponse(
            content=WaveformResponse(alert_id=alert_id, **waveform).model_dump(mode="json"),
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # Tier 3: compute from WAV (cold path)
    # _get_baseline_audio_key_or_404 already verified the WAV exists
    tmp_path = await storage.async_download_to_tempfile(audio_key)
    try:
        waveform = await asyncio.to_thread(generate_waveform, tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)

    await storage.async_upload_bytes(json_key, json.dumps(waveform).encode(), "application/json")
    put_waveform_in_cache(audio_key, waveform)
    return JSONResponse(
        content=WaveformResponse(alert_id=alert_id, **waveform).model_dump(mode="json"),
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{alert_id}/baseline/spectrogram")
async def get_baseline_spectrogram(
    alert_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    s3_key, sound_clip = await _get_baseline_audio_key_or_404(session, alert_id)
    clip_name = Path(sound_clip).stem
    spec_key = f"spectrograms/baseline_{clip_name}.png"
    if not await storage.async_file_exists(spec_key):
        tmp_wav = await storage.async_download_to_tempfile(s3_key)
        try:
            png_bytes = generate_spectrogram(tmp_wav)
        finally:
            tmp_wav.unlink(missing_ok=True)
        await storage.async_upload_bytes(spec_key, png_bytes, "image/png")
    url = await storage.async_generate_presigned_url(spec_key)
    return RedirectResponse(url=url, status_code=302)
