import math
import uuid
import wave
from pathlib import Path

from app.services.media import (
    WaveformData,
    generate_waveform,
    get_waveform_from_cache,
    put_waveform_in_cache,
)


def _make_wav(path: Path, duration: float = 0.1, sr: int = 8000) -> None:
    """Write a valid mono 16-bit PCM WAV file containing a 440 Hz sine wave."""
    n_samples = int(duration * sr)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sr)
        for i in range(n_samples):
            value = int(32767 * 0.5 * math.sin(2 * math.pi * 440 * i / sr))
            wav_file.writeframesraw(value.to_bytes(2, byteorder="little", signed=True))


# ---------------------------------------------------------------------------
# generate_waveform tests
# ---------------------------------------------------------------------------


def test_waveform_returns_expected_keys(tmp_path: Path) -> None:
    wav = tmp_path / "test.wav"
    _make_wav(wav)
    result = generate_waveform(wav)
    assert set(result.keys()) == {"sample_rate", "duration_seconds", "times", "amplitudes"}


def test_waveform_times_amplitudes_same_length(tmp_path: Path) -> None:
    wav = tmp_path / "test.wav"
    _make_wav(wav)
    result = generate_waveform(wav)
    assert len(result["times"]) == len(result["amplitudes"])


def test_waveform_positive_sample_rate_and_duration(tmp_path: Path) -> None:
    wav = tmp_path / "test.wav"
    _make_wav(wav)
    result = generate_waveform(wav)
    assert result["sample_rate"] > 0
    assert result["duration_seconds"] > 0


def test_waveform_duration_approximately_correct(tmp_path: Path) -> None:
    duration = 0.25
    wav = tmp_path / "test.wav"
    _make_wav(wav, duration=duration, sr=8000)
    result = generate_waveform(wav)
    assert abs(result["duration_seconds"] - duration) < 0.05


def test_waveform_max_points_limits_output(tmp_path: Path) -> None:
    # 0.5 s at 8000 Hz = 4000 samples — well above max_points=10
    wav = tmp_path / "test.wav"
    _make_wav(wav, duration=0.5, sr=8000)
    result = generate_waveform(wav, max_points=10)
    assert len(result["times"]) <= 10
    assert len(result["amplitudes"]) <= 10


def test_waveform_amplitudes_all_finite(tmp_path: Path) -> None:
    import math as _math

    wav = tmp_path / "test.wav"
    _make_wav(wav)
    result = generate_waveform(wav)
    for amp in result["amplitudes"]:
        assert _math.isfinite(amp), f"Non-finite amplitude: {amp}"


def test_waveform_times_monotonically_non_decreasing(tmp_path: Path) -> None:
    wav = tmp_path / "test.wav"
    _make_wav(wav, duration=0.25)
    result = generate_waveform(wav)
    times = result["times"]
    for i in range(1, len(times)):
        assert times[i] >= times[i - 1], f"times[{i}]={times[i]} < times[{i - 1}]={times[i - 1]}"


# ---------------------------------------------------------------------------
# Cache tests
# ---------------------------------------------------------------------------


def test_cache_miss_returns_none() -> None:
    result = get_waveform_from_cache("nonexistent-xyz-absolutely-not-here")
    assert result is None


def test_cache_put_then_get_returns_same_data() -> None:
    key = f"test-{uuid.uuid4()}"
    data: WaveformData = {
        "sample_rate": 8000,
        "duration_seconds": 0.1,
        "times": [0.0, 0.01],
        "amplitudes": [0.1, -0.1],
    }
    put_waveform_in_cache(key, data)
    assert get_waveform_from_cache(key) == data


def test_cache_different_keys_are_isolated() -> None:
    key_a = f"test-a-{uuid.uuid4()}"
    key_b = f"test-b-{uuid.uuid4()}"
    data: WaveformData = {
        "sample_rate": 8000,
        "duration_seconds": 0.1,
        "times": [0.0],
        "amplitudes": [0.5],
    }
    put_waveform_in_cache(key_a, data)
    assert get_waveform_from_cache(key_b) is None


def test_cache_overwrite_returns_latest_value() -> None:
    key = f"test-overwrite-{uuid.uuid4()}"
    first: WaveformData = {
        "sample_rate": 8000,
        "duration_seconds": 0.1,
        "times": [0.0],
        "amplitudes": [0.1],
    }
    second: WaveformData = {
        "sample_rate": 16000,
        "duration_seconds": 0.2,
        "times": [0.0, 0.1],
        "amplitudes": [0.5, -0.5],
    }
    put_waveform_in_cache(key, first)
    put_waveform_in_cache(key, second)
    assert get_waveform_from_cache(key) == second
