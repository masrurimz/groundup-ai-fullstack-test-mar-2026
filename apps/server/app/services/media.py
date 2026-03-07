from pathlib import Path

import librosa
import librosa.display
import matplotlib
import matplotlib.pyplot as plt
import numpy as np

matplotlib.use("Agg")

FMAX_HZ = 8000
N_MELS = 128
HOP_LENGTH = 512
N_FFT = 2048


def generate_spectrogram(wav_path: Path, output_path: Path) -> Path:
    y, sr = librosa.load(str(wav_path), sr=None)

    mel_spec = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        n_mels=N_MELS,
        fmax=FMAX_HZ,
    )
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

    fig, ax = plt.subplots(figsize=(10, 4))
    img = librosa.display.specshow(
        mel_spec_db,
        sr=sr,
        hop_length=HOP_LENGTH,
        fmax=FMAX_HZ,
        x_axis="time",
        y_axis="mel",
        ax=ax,
    )
    fig.colorbar(img, ax=ax, format="%+2.0f dB")
    ax.set_title("Mel Spectrogram")
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("Frequency (Hz)")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.tight_layout()
    plt.savefig(str(output_path), dpi=100, bbox_inches="tight", format="png")
    plt.close(fig)
    return output_path


def generate_waveform(
    wav_path: Path, max_points: int = 2048
) -> dict[str, float | int | list[float]]:
    y, sr = librosa.load(str(wav_path), sr=None, mono=True)

    sample_step = max(1, len(y) // max_points)
    sampled = y[::sample_step]
    times = (np.arange(len(sampled)) * sample_step) / sr

    return {
        "sample_rate": int(sr),
        "duration_seconds": float(len(y) / sr),
        "times": [float(t) for t in times],
        "amplitudes": [float(a) for a in sampled],
    }
