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
5. **WAV files** are uploaded to S3 (RustFS) from `../extracted_data/Fullstack Test/`. The S3 key for each file matches the `sound_clip` filename stored in the alert row (e.g., `1.wav`).
6. **Baseline audio files** (per-machine baseline WAVs, if present) are also uploaded to S3 during seed.

Seed is idempotent for lookup tables (machines, reasons, actions) — duplicate key conflicts are skipped. Alert rows are inserted fresh on each seed run if the table is empty, otherwise skipped.

## Audio Files

WAV files are stored in S3-compatible RustFS object storage, not on the local filesystem. The audio endpoint (`GET /api/v1/alerts/{id}/audio`) resolves `alert.sound_clip` to the S3 key, generates a presigned URL, and returns a `302` redirect to the client. The browser fetches audio directly from RustFS via the presigned URL.

The local `AUDIO_DIR` path is used as the source directory during seeding only; it is not a runtime serving directory.

Baseline audio is served via a separate endpoint: `GET /alerts/{id}/baseline/audio`, which follows the same presigned redirect pattern for the machine's baseline WAV.

## Waveform Generation

`GET /api/v1/alerts/{id}/waveform` returns a JSON payload:

```json
{
  "alert_id": "019532ab-...",
  "times": [0.0, 0.023, 0.046, ...],
  "amplitudes": [-0.003, 0.124, ...],
  "duration_seconds": 4.2
}
```

Waveform data is resolved through a three-tier cache:

1. **Tier 1 — in-memory dict** keyed by the S3 audio key. No I/O. Fastest path; populated on first compute or on S3 JSON hit.
2. **Tier 2 — pre-computed JSON in S3** at `waveforms/{sound_clip}.json`. On an in-memory cache miss, the backend attempts to download this file. If present, it is parsed and inserted into the in-memory cache.
3. **Tier 3 — cold compute** (S3 JSON miss). The WAV is downloaded from S3, processed with [librosa](https://librosa.org) to extract amplitude samples and timing, the resulting JSON is uploaded to S3 at the Tier 2 path, and the result is stored in the in-memory cache.

Baseline waveform is served via `GET /alerts/{id}/baseline/waveform`, following the same three-tier cache logic against the machine's baseline WAV.

Frontend renders the waveform as an inline SVG, downsampled to at most one point per display pixel.

## Spectrogram Generation

`GET /api/v1/alerts/{id}/spectrogram` returns a PNG image.

On request:

1. Backend checks S3 for a pre-computed spectrogram at `spectrograms/{alert_id}.png`.
2. If not present, it downloads the WAV from S3, generates a mel spectrogram via librosa and matplotlib (fmax=8000 Hz, 128 mel bins, n_fft=2048, hop_length=512), and uploads the PNG to S3.
3. The endpoint returns a presigned redirect URL pointing to the S3 object. Subsequent requests serve the cached PNG from S3 via the same redirect mechanism.

## Environment Configuration

The following environment variables control the pipeline (all set via Infisical self-hosted at `https://infisical.zahid.es`):

| Variable       | Default                                                    | Description                                   |
| -------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL` | `postgresql+asyncpg://localhost/groundup`                  | SQLAlchemy async database URL (PostgreSQL)    |
| `DATASET_DIR`  | `../extracted_data/Fullstack Test` (relative to repo root) | Source dataset directory                      |
| `DATASET_FILE` | `Test Dataset.xlsx`                                        | Filename within DATASET_DIR                   |
| `ENVIRONMENT`  | `development`                                              | One of `development`, `staging`, `production` |

### S3 / RustFS Storage

Audio WAVs, waveform JSON, and spectrogram PNGs are all stored in and served from RustFS, an S3-compatible object store. The following variables configure the S3 client:

| Variable        | Description                             |
| --------------- | --------------------------------------- |
| `S3_ENDPOINT`   | RustFS endpoint URL                     |
| `S3_ACCESS_KEY` | S3 access key                           |
| `S3_SECRET_KEY` | S3 secret key                           |
| `S3_BUCKET`     | Bucket name for all stored objects      |
| `S3_REGION`     | S3 region (may be arbitrary for RustFS) |

All S3 variables are injected at runtime via Infisical; there are no hardcoded defaults.
