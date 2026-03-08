# Data Pipeline

## Dataset Source

The backend reads raw data from a directory **outside** the repo root:

```
../extracted_data/Fullstack Test/
├── Test Dataset.xlsx      # Alert rows
├── 1.wav
├── 2.wav
├── 3.wav
├── 4.wav
├── 5.wav
└── 6.wav
```

This path is configurable via `DATASET_DIR` in `app/core/config.py`. The default resolves to four directories above `config.py`, which is the repo parent.

The `DATASET_FILE` setting defaults to `Test Dataset.xlsx`.

## Seed Strategy

Seeding is split into two scripts, both invoked via the root `package.json`:

| Command            | Script                                | Effect                                               |
| ------------------ | ------------------------------------- | ---------------------------------------------------- |
| `bun run seed`     | `apps/server/app/scripts/seed.py`     | Seeds machines, reasons, actions, and dataset alerts |
| `bun run seed:dev` | `apps/server/app/scripts/seed_dev.py` | As above + inserts additional dev-only sample alerts |

On seed:

1. **Machines** are inserted from a hardcoded catalog in the seed script.
2. **Reasons** are inserted scoped to their machine.
3. **Actions** are inserted as global entries.
4. **Alerts** are read from `Test Dataset.xlsx` via `pandas` + `openpyxl`. Each row is mapped to an `Alert` row. The `machine` text column and the resolved `machine_id` FK are both written.
5. **WAV files** are copied from `../extracted_data/Fullstack Test/` into `apps/server/data/audio/`.

Seed is idempotent for lookup tables (machines, reasons, actions) — duplicate key conflicts are skipped. Alert rows are inserted fresh on each seed run if the table is empty, otherwise skipped.

## Audio Files

WAV files are served directly by FastAPI from `apps/server/data/audio/`. The audio endpoint supports HTTP `Range` headers, enabling seek-anywhere playback in the browser without downloading the full file.

Path resolution: `AUDIO_DIR / alert.sound_clip`, where `sound_clip` is the filename stored in the `Alert` row (e.g., `1.wav`).

## Waveform Generation

`GET /api/v1/alerts/{id}/waveform` returns a JSON payload:

```json
{
  "alert_id": 1,
  "times": [0.0, 0.023, 0.046, ...],
  "amplitudes": [-0.003, 0.124, ...],
  "duration_seconds": 4.2
}
```

Generation uses [librosa](https://librosa.org) to load the WAV and compute amplitude samples. Results are cached in memory keyed by file path so repeated requests for the same alert do not re-process the audio.

Frontend renders the waveform as an inline SVG, downsampled to at most one point per display pixel.

## Spectrogram Generation

`GET /api/v1/alerts/{id}/spectrogram` returns a PNG image.

On first access:

1. Backend checks `apps/server/data/spectrograms/{alert_id}.png`.
2. If not present, it loads the WAV via librosa and generates a mel-spectrogram using matplotlib, saved as PNG.
3. Subsequent requests serve the cached PNG directly via `FileResponse`.

The spectrogram directory is `SPECTROGRAM_DIR` (default: `apps/server/data/spectrograms/`).

## Environment Configuration

The following environment variables control data paths (all have working defaults for local dev; set via Infisical for other environments):

| Variable       | Default                                                    | Description                                   |
| -------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL` | `sqlite+aiosqlite:///./groundup.db`                        | SQLAlchemy async database URL                 |
| `DATASET_DIR`  | `../extracted_data/Fullstack Test` (relative to repo root) | Source dataset directory                      |
| `DATASET_FILE` | `Test Dataset.xlsx`                                        | Filename within DATASET_DIR                   |
| `ENVIRONMENT`  | `development`                                              | One of `development`, `staging`, `production` |

`AUDIO_DIR` and `SPECTROGRAM_DIR` are derived from `SERVER_DATA_DIR` in config and are not separately configurable without code change.
