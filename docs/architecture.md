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
                                └── SQLite (dev) / PostgreSQL (prod)
```

## Data Model

### Alert

The primary entity. Represents a single anomaly detection event from a machine sensor.

| Column                | Type             | Description                                                  |
| --------------------- | ---------------- | ------------------------------------------------------------ |
| `id`                  | int PK           |                                                              |
| `timestamp`           | datetime (tz)    | When the anomaly was detected                                |
| `machine`             | string           | Machine name snapshot (denormalized for history)             |
| `machine_id`          | int FK → Machine | Resolved machine reference (nullable, added in v2)           |
| `anomaly_type`        | string           | Classification of the anomaly                                |
| `sensor`              | string           | Sensor that captured the event                               |
| `sound_clip`          | string           | Filename of the associated WAV file                          |
| `suspected_reason`    | text             | Reason text snapshot (denormalized)                          |
| `suspected_reason_id` | int FK → Reason  | Resolved reason (nullable)                                   |
| `action`              | text             | Action text snapshot (denormalized)                          |
| `action_id`           | int FK → Action  | Resolved action (nullable)                                   |
| `comment`             | text             | Free-text operator note                                      |
| `updated_at`          | datetime (tz)    | Last annotation timestamp                                    |
| `updated_by`          | string           | Actor who last annotated (currently hardcoded to `admin-ui`) |

Text snapshot columns (`machine`, `suspected_reason`, `action`) exist alongside FK columns to preserve historical readability when lookup values are later renamed or deactivated.

### Machine

Catalog of industrial machines. Scopes reasons.

| Column                      | Type          | Description                                |
| --------------------------- | ------------- | ------------------------------------------ |
| `id`                        | int PK        |                                            |
| `key`                       | string unique | Normalized lowercase key derived from name |
| `name`                      | string        | Display name                               |
| `is_active`                 | bool          | Whether selectable in alert forms          |
| `created_at` / `updated_at` | datetime (tz) |                                            |

### Reason

Anomaly reasons, scoped per machine.

| Column                      | Type             | Description                                  |
| --------------------------- | ---------------- | -------------------------------------------- |
| `id`                        | int PK           |                                              |
| `machine_id`                | int FK → Machine | Owning machine                               |
| `key`                       | string           | Normalized key (unique within machine scope) |
| `reason`                    | string           | Display text                                 |
| `is_active`                 | bool             | Whether selectable in alert forms            |
| `created_at` / `updated_at` | datetime (tz)    |                                              |

### Action

Global remediation actions (not machine-scoped).

| Column                      | Type          | Description                       |
| --------------------------- | ------------- | --------------------------------- |
| `id`                        | int PK        |                                   |
| `key`                       | string unique | Normalized key                    |
| `action`                    | string        | Display text                      |
| `is_active`                 | bool          | Whether selectable in alert forms |
| `created_at` / `updated_at` | datetime (tz) |                                   |

### AuditLog

Append-only log of mutations. Written on every alert annotation and every settings create/update.

| Column                       | Type          | Description                                   |
| ---------------------------- | ------------- | --------------------------------------------- |
| `id`                         | int PK        |                                               |
| `entity_type`                | string        | `alert`, `machine`, `reason`, or `action`     |
| `entity_id`                  | int           | PK of the affected row                        |
| `operation`                  | string        | `create` or `update`                          |
| `actor`                      | string        | Currently always `admin-ui`                   |
| `before_json` / `after_json` | JSON          | State snapshot before and after the operation |
| `created_at`                 | datetime (tz) |                                               |

## API Surface

All routes are prefixed `/api/v1`. Interactive docs available at `/docs` (Swagger) and `/redoc`.

### Alerts

| Method  | Path                       | Description                                                               |
| ------- | -------------------------- | ------------------------------------------------------------------------- |
| `GET`   | `/alerts`                  | List alerts. Query params: `machine`, `anomaly`, `start_date`, `end_date` |
| `GET`   | `/alerts/{id}`             | Single alert detail                                                       |
| `PATCH` | `/alerts/{id}`             | Annotate alert — set `suspected_reason_id`, `action_id`, `comment`        |
| `GET`   | `/alerts/{id}/audio`       | Stream WAV file. Supports `Range` header for seeking                      |
| `GET`   | `/alerts/{id}/waveform`    | Waveform JSON: `{ times[], amplitudes[], duration_seconds }`              |
| `GET`   | `/alerts/{id}/spectrogram` | PNG spectrogram image (generated on first access, cached)                 |

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

## Schema Migrations

Two applied migrations:

1. `69333faeabcc` — initial schema: `alerts`, `reasons`, `actions`
2. `1f0f7c9f4a21` — v2 schema: adds `machines`, `audit_log`; extends `alerts` with FK columns; adds `is_active` and normalized keys to reasons/actions

Migration strategy: no backfill. The project had no production data at the time of the v2 migration. Fresh environments are seeded deterministically.

See [`apps/server/MIGRATION_GUIDE.md`](../apps/server/MIGRATION_GUIDE.md) for migration commands.
