# Architecture

## Overview

The application is a fullstack monorepo with a React frontend and a FastAPI backend. The frontend renders server-side via TanStack Start and deploys to Cloudflare Workers. The backend is a standalone FastAPI service.

```
Browser
  └── TanStack Start (SSR, Cloudflare Worker)
        └── TanStack Router (file-based, client-side navigation after hydration)
              ├── TanStack Query (server state, cache, mutation)
              ├── TanStack Form (form state, validation)
              └── OpenAPI client (generated from FastAPI spec)
                    └── FastAPI (Python 3.13, async)
                          └── SQLAlchemy async
                                └── PostgreSQL + TimescaleDB
                                └── S3-compatible RustFS (audio, waveform, spectrogram)
```

Audio files, waveform JSON, and spectrogram images are stored in S3-compatible RustFS object storage. Audio and spectrogram endpoints serve presigned redirect URLs. Waveform data is resolved through a three-tier cache (in-memory → S3 JSON → compute from WAV).

## Data Model

### Alert

The primary entity. Represents a single anomaly detection event from a machine sensor.

| Column                | Type              | Description                                                  |
| --------------------- | ----------------- | ------------------------------------------------------------ |
| `id`                  | uuid PK           |                                                              |
| `serial_number`       | int (identity)    | Auto-incrementing display number                             |
| `timestamp`           | datetime (tz)     | When the anomaly was detected                                |
| `machine`             | string            | Machine name snapshot (denormalized for history)             |
| `machine_id`          | uuid FK → Machine | Resolved machine reference (nullable)                        |
| `anomaly_type`        | string            | Classification of the anomaly                                |
| `sensor`              | string            | Sensor name snapshot (denormalized for history)              |
| `sensor_id`           | uuid FK → Sensor  | Resolved sensor reference (nullable)                         |
| `sound_clip`          | string            | S3 object key of the associated WAV file                     |
| `suspected_reason`    | text              | Reason text snapshot (denormalized)                          |
| `suspected_reason_id` | uuid FK → Reason  | Resolved reason (nullable)                                   |
| `action`              | text              | Action text snapshot (denormalized)                          |
| `action_id`           | uuid FK → Action  | Resolved action (nullable)                                   |
| `comment`             | text              | Free-text operator note                                      |
| `updated_at`          | datetime (tz)     | Last annotation timestamp                                    |
| `updated_by`          | string            | Actor who last annotated (currently hardcoded to `admin-ui`) |

| `status` | computed (hybrid_property) | "resolved" when both action and suspected_reason are set, otherwise "unresolved" |

Text snapshot columns (`machine`, `sensor`, `suspected_reason`, `action`) exist alongside FK columns to preserve historical readability when lookup values are later renamed or deactivated.

### Machine

Catalog of industrial machines. Scopes reasons.

| Column                      | Type          | Description                                  |
| --------------------------- | ------------- | -------------------------------------------- |
| `id`                        | uuid PK       |                                              |
| `key`                       | string unique | Normalized lowercase key derived from name   |
| `name`                      | string        | Display name                                 |
| `is_active`                 | bool          | Whether selectable in alert forms            |
| `baseline_sound_clip`       | string        | S3 object key of the baseline WAV (nullable) |
| `created_at` / `updated_at` | datetime (tz) |                                              |

### Sensor

Sensors attached to machines. Alert events reference a sensor by FK.

| Column                      | Type              | Description                       |
| --------------------------- | ----------------- | --------------------------------- |
| `id`                        | uuid PK           |                                   |
| `machine_id`                | uuid FK → Machine | Owning machine                    |
| `serial`                    | string            | Physical serial number            |
| `name`                      | string            | Display name                      |
| `key`                       | string            | Normalized key                    |
| `is_active`                 | bool              | Whether selectable in alert forms |
| `created_at` / `updated_at` | datetime (tz)     |                                   |

### Reason

Anomaly reasons, scoped per machine.

| Column                      | Type              | Description                                  |
| --------------------------- | ----------------- | -------------------------------------------- |
| `id`                        | uuid PK           |                                              |
| `machine_id`                | uuid FK → Machine | Owning machine                               |
| `key`                       | string            | Normalized key (unique within machine scope) |
| `reason`                    | string            | Display text                                 |
| `is_active`                 | bool              | Whether selectable in alert forms            |
| `created_at` / `updated_at` | datetime (tz)     |                                              |

### Action

Global remediation actions (not machine-scoped).

| Column                      | Type          | Description                       |
| --------------------------- | ------------- | --------------------------------- |
| `id`                        | uuid PK       |                                   |
| `key`                       | string unique | Normalized key                    |
| `action`                    | string        | Display text                      |
| `is_active`                 | bool          | Whether selectable in alert forms |
| `created_at` / `updated_at` | datetime (tz) |                                   |

### AuditLog

Append-only log of mutations. Written on every alert annotation and every settings create/update. Implemented as a TimescaleDB hypertable partitioned on `created_at`.

| Column                       | Type          | Description                                   |
| ---------------------------- | ------------- | --------------------------------------------- |
| `id`                         | uuid PK       |                                               |
| `entity_type`                | string        | `alert`, `machine`, `reason`, or `action`     |
| `entity_id`                  | uuid          | PK of the affected row                        |
| `operation`                  | string        | `create` or `update`                          |
| `actor`                      | string        | Currently always `admin-ui`                   |
| `before_json` / `after_json` | JSON          | State snapshot before and after the operation |
| `created_at`                 | datetime (tz) |                                               |

## API Surface

All routes are prefixed `/api/v1`. Interactive docs available at `/docs` (Swagger) and `/redoc`.

### Alerts

| Method  | Path                             | Description                                                                                                                  |
| ------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/alerts`                        | List alerts. Query params: `machine`, `anomaly`, `start_date`, `end_date`                                                    |
| `GET`   | `/alerts/{id}`                   | Single alert detail                                                                                                          |
| `PATCH` | `/alerts/{id}`                   | Annotate alert — set `suspected_reason_id`, `action_id`, `comment`                                                           |
| `GET`   | `/alerts/{id}/audio`             | Redirects to presigned S3 URL for the WAV file                                                                               |
| `GET`   | `/alerts/{id}/waveform`          | Waveform JSON: `{ times[], amplitudes[], duration_seconds }`. Three-tier cache: in-memory dict → S3 JSON → computed from WAV |
| `GET`   | `/alerts/{id}/spectrogram`       | Redirects to presigned S3 URL for the PNG spectrogram (mel scale, fmax=8000 Hz, n_mels=128, n_fft=2048, hop_length=512)      |
| `GET`   | `/alerts/{id}/baseline/audio`    | Redirects to presigned S3 URL for the machine's baseline WAV file                                                            |
| `GET`   | `/alerts/{id}/baseline/waveform` | Waveform JSON for the machine's baseline audio                                                                               |

Alert list is sorted descending by timestamp. The `PATCH` endpoint validates that selected reasons belong to the alert's machine and that both reasons and actions are active. Inactive selections are rejected with HTTP 400.

### Lookup

| Method  | Path                    | Description                                                                                       |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `GET`   | `/lookup`               | All lookup items. Params: `category` (machines/reasons/actions), `machine_id`, `include_inactive` |
| `GET`   | `/lookup/machines`      | Machines only. Param: `include_inactive`                                                          |
| `POST`  | `/lookup/machines`      | Create machine                                                                                    |
| `PATCH` | `/lookup/machines/{id}` | Update machine name or `is_active`                                                                |
| `GET`   | `/lookup/reasons`       | Reasons. Params: `machine_id`, `machine` (legacy name filter), `include_inactive`                 |
| `POST`  | `/lookup/reasons`       | Create reason (requires `machine_id`)                                                             |
| `PATCH` | `/lookup/reasons/{id}`  | Update reason text or `is_active`                                                                 |
| `GET`   | `/lookup/actions`       | Actions. Param: `include_inactive`                                                                |
| `POST`  | `/lookup/actions`       | Create action                                                                                     |
| `PATCH` | `/lookup/actions/{id}`  | Update action text or `is_active`                                                                 |

All create operations return HTTP 201. Duplicate key conflicts return HTTP 409.

### Health

| Method | Path      | Description                                           |
| ------ | --------- | ----------------------------------------------------- |
| `GET`  | `/health` | Returns `{ "status": "ok" }` — compatibility endpoint |

## Frontend Component Map

### Routes

| Route                | File                                         | Purpose                                             |
| -------------------- | -------------------------------------------- | --------------------------------------------------- |
| `/`                  | `routes/index.tsx`                           | Dashboard — stats, machine breakdown, recent alerts |
| `/alerts`            | `routes/alerts.tsx` + `alerts.index.tsx`     | Alert list layout + empty state                     |
| `/alerts/$alertId`   | `routes/alerts.$alertId.tsx`                 | Alert detail — media panels + annotation form       |
| `/settings`          | `routes/settings.tsx` + `settings.index.tsx` | Settings layout + index redirect                    |
| `/settings/machines` | `routes/settings.machines.tsx`               | Machine catalog CRUD                                |
| `/settings/reasons`  | `routes/settings.reasons.tsx`                | Reason CRUD (machine-scoped)                        |
| `/settings/actions`  | `routes/settings.actions.tsx`                | Action CRUD (global)                                |

### Dashboard Components (`components/dashboard/`)

| Component               | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| `StatsCard`             | Metric tile with icon, value, trend, and severity variant      |
| `MachineBreakdownChart` | Machine health status distribution (healthy/warning/critical)  |
| `RecentAlertsTable`     | Paginated alerts table with severity badges and row navigation |

### Alert Detail Components (`components/alerts/`)

Alert detail is composed inline in `routes/alerts.$alertId.tsx`. Key sub-components:

- `AudioPlayer` — wraps `react-h5-audio-player` with byte-range streaming
- `WaveformChart` — SVG chart rendered from waveform API data (downsampled to screen width)
- `SpectrogramImage` — lazy-loaded PNG from the spectrogram endpoint
- `AlertEditForm` — TanStack Form with reason/action dropdowns (filtered to active, machine-scoped) and comment field

### API Layer (`lib/api/`)

| File                | Exports                                                     |
| ------------------- | ----------------------------------------------------------- |
| `client.ts`         | Base `hey-api` OpenAPI client instance                      |
| `alerts.ts`         | Alert fetch, waveform fetch, audio/spectrogram URL builders |
| `lookup.ts`         | Lookup fetch functions                                      |
| `use-alerts-api.ts` | TanStack Query hook for alert list                          |
| `alert-view.ts`     | `AlertView` type — frontend-normalized alert shape          |

### Query Layer (`lib/query/`)

TanStack Query options and mutation hooks for alerts and lookup entities. Settings pages use `ensureQueryData` loaders for prefetch on route entry.

## Analytics Endpoints

| Method | Path                                                    | Description            |
| ------ | ------------------------------------------------------- | ---------------------- |
| GET    | `/api/v1/analytics/overview?days=30`                    | DashboardOverview      |
| GET    | `/api/v1/analytics/alert-trends?days=30&interval=1 day` | AlertTrendBucket[]     |
| GET    | `/api/v1/analytics/machine-health?days=30`              | MachineHealthSummary[] |

## Schema Migrations

Six applied migrations:

1. `0a412b99977d` — initial PostgreSQL/TimescaleDB schema with uuid7 PKs: `machines`, `sensors`, `reasons`, `actions`, `alerts`; `audit_log` as a TimescaleDB hypertable partitioned on `created_at` (alerts is a plain table at this stage)

2. `b1c2d3e4f5a6` — adds `baseline_sound_clip` to `machines`

3. `c2d3e4f5a6b7` — alerts hypertable (partition on timestamp, compression after 7d, segment by machine_id)

4. `d3e4f5a6b7c8` — continuous aggregates (alerts_hourly_stats: bucket/machine_id/machine/anomaly_type, alert_count, unresolved_count)

5. `e4f5a6b7c8d9` — CA realtime mode (materialized_only = false)

6. `f5a6b7c8d9e0` — CA resolved logic (unresolved_count = action IS NULL OR suspected_reason IS NULL)

Migration strategy: no backfill. The project had no production data at the time of initial migration. Fresh environments are seeded deterministically.

See [`apps/server/MIGRATION_GUIDE.md`](../apps/server/MIGRATION_GUIDE.md) for migration commands.

## TimescaleDB

### Alerts Hypertable

- `alerts` is a hypertable partitioned on `timestamp`
- Compression policy after 7 days
- Segmented by `machine_id`

### Continuous Aggregates

- `alerts_hourly_stats` is a continuous aggregate in realtime mode
- Groups by `bucket/machine_id/machine/anomaly_type`
- Tracks `alert_count` and `unresolved_count`
- Refresh policy: 30-min interval, 3-hour lookback
- After each alert PATCH, a manual `CALL refresh_continuous_aggregate()` is issued for the alert's creation-time 1-hour bucket, keeping `unresolved_count` consistent for historical alerts
