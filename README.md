# GroundUp AI — Industrial Anomaly Monitoring

A fullstack web application for monitoring industrial machine anomaly alerts. Operators review audio recordings of anomalous machine outputs, examine waveforms and spectrograms, and annotate each alert with a suspected reason, remediation action, and comment. Machine, reason, and action catalogs are managed through a dedicated settings interface.

## Live Demo

- Frontend: https://groundup.zahid.es
- API docs: https://api-groundup.zahid.es/docs
- Deployed on a local server via Cloudflare Tunnel (GCP trial expired)

## Features

- [x] Alert list with machine / anomaly type / date range filtering
- [x] Alert detail: audio player, waveform visualization, mel spectrogram
- [x] Annotation form: reason (machine-scoped), action, free-text comment
- [x] Baseline audio comparison per machine
- [x] Dashboard: stats, machine health breakdown, recent alerts
- [x] Settings: machine, reason (machine-scoped), action CRUD with active-state toggling
- [x] Contract-first API: OpenAPI spec, generated TypeScript client
- [x] Audit log: append-only change history on every annotation and settings mutation
- [x] Backend test suite (pytest)
- [x] Frontend unit tests (vitest + testing-library)

## Tech Stack

| Layer      | Technology                                                                     |
| ---------- | ------------------------------------------------------------------------------ |
| Frontend   | React 19, TanStack Start (SSR), TanStack Router, TanStack Query, TanStack Form |
| UI         | Tailwind CSS v4, shadcn/ui, Base UI                                            |
| Backend    | FastAPI, SQLAlchemy async, Alembic, Python 3.13                                |
| Database   | PostgreSQL + TimescaleDB                                                       |
| Storage    | RustFS (S3-compatible object storage) — audio, waveform cache, spectrograms    |
| Monorepo   | Turborepo, Bun 1.3.9                                                           |
| Deployment | Docker Compose + Cloudflare Tunnel                                             |
| Secrets    | Infisical (self-hosted)                                                        |
| Linting    | Oxlint + Oxfmt                                                                 |

## Architecture Overview

The frontend (TanStack Start, SSR) communicates with a FastAPI backend over HTTP. The backend persists relational data (alerts, machines, reasons, actions) in PostgreSQL; the `audit_log` table uses a TimescaleDB hypertable for append-only mutation history with automatic compression on cold rows. All binary assets (audio WAVs, spectrogram PNGs, waveform JSON) are stored in RustFS — an S3-compatible object store. Audio and spectrograms are served via presigned S3 redirect URLs; waveform data goes through a three-tier cache before reaching the client.

See [`docs/architecture.md`](docs/architecture.md) for the full data model, API surface, and component map.

## Engineering Decisions

- **TanStack Start over Next.js** — edge SSR with file-based routing and first-class TanStack Query integration; no framework lock-in for signal processing-heavy data flows
- **FastAPI + librosa** — Python's signal processing ecosystem (librosa, numpy, scipy) is the natural choice for audio analysis; EE background informs mel spectrogram parameter selection (fmax=8 kHz, 128 mel bins)
- **PostgreSQL + TimescaleDB** — relational data (alerts, machines, reasons, actions) lives in PostgreSQL; the `audit_log` table is a TimescaleDB hypertable with automatic compression on cold rows, reducing storage cost for the append-only history
- **Three-tier waveform cache** — hot path: in-memory dict (zero I/O); warm path: pre-computed JSON in S3 (one network round-trip); cold path: librosa computation + S3 upload; subsequent requests never recompute
- **Contract-first API** — FastAPI generates the OpenAPI spec; TypeScript client is generated via hey-api; CI verifies the client is in sync; no client/server drift
- **S3/RustFS object storage** — binary assets are decoupled from the app server; audio and spectrograms are served via presigned redirect (no proxy buffering)
- **Infisical (self-hosted)** — zero `.env` files in the repo; secrets injected at runtime per environment (dev/staging/prod) via `infisical run`; single source of truth for credentials across the monorepo
- **Turborepo monorepo** — single atomic changesets, shared TypeScript config, parallel builds; `bun run dev` starts both apps with Infisical env injection

## Project Structure

```
groundup-ai-fullstack-test-mar-2026/
├── apps/
│   ├── web/               # Frontend (React + TanStack Start) — port 3001
│   │   └── src/
│   │       ├── routes/    # File-based TanStack Router routes
│   │       ├── components/ # Dashboard, alerts, settings, UI primitives
│   │       └── lib/       # API client, query options, utilities
│   └── server/            # Backend API (FastAPI) — port 8000
│       ├── app/
│       │   ├── api/       # Route handlers (alerts, lookup)
│       │   ├── models.py  # SQLAlchemy ORM models
│       │   ├── schemas/   # Pydantic request/response schemas
│       │   ├── services/  # Business logic, media processing
│       │   └── core/      # Config, database session
│       ├── alembic/       # Schema migrations
│       └── data/          # Audio files, spectrogram cache
├── packages/
│   ├── config/            # Shared TypeScript config
│   ├── env/               # Environment variable schema
│   └── infra/             # Alchemy / Cloudflare infra definitions
├── docs/
│   ├── architecture.md    # Data model, API surface, component map
│   ├── data-pipeline.md   # Dataset setup, seed strategy, media pipeline
│   └── settings-rollout.md # QA checklist for settings schema
└── scripts/               # Dev utilities (env switching, client codegen)
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3.9+
- Python 3.13 (managed via `.python-version` in `apps/server/`)
- [mise](https://mise.jdx.dev) — installs `infisical` CLI automatically (`mise install`)
- Access to the Infisical workspace at `https://infisical.zahid.es`

### 1. Authenticate with Infisical

All secrets are injected at runtime via Infisical. No `.env` files need to be created manually.

```bash
infisical login --domain https://infisical.zahid.es/api
```

Switch environments (default is `dev`):

```bash
bun env:use dev       # development
bun env:use staging   # staging
bun env:use prod      # production
bun env:use           # show current environment
```

Key variables injected: `DATABASE_URL`, `CORS_ORIGINS`, `VITE_SERVER_URL`, `ENVIRONMENT`.

For Tailscale remote access, set `CORS_ORIGINS` and `VITE_SERVER_URL` in Infisical with your Tailscale hostname. Both services bind to `0.0.0.0` in dev mode.

### 2. Install dependencies

```bash
bun install
```

### 3. Prepare the dataset

The backend reads from `../extracted_data/Fullstack Test/` relative to the repo root. This directory must exist and contain:

- `Test Dataset.xlsx`
- `1.wav` through `6.wav`

See [`docs/data-pipeline.md`](docs/data-pipeline.md) for the full dataset and seed strategy.

### 4. Run migrations and seed

```bash
bun run db:migrate    # apply Alembic migrations
bun run seed:dev      # seed lookup tables + dataset alerts + dev-only sample alerts
```

Use `bun run seed` (without `:dev`) on non-dev environments to skip sample-only rows.

### 5. Start the development server

```bash
bun run dev
```

- Frontend: [http://localhost:3001](http://localhost:3001)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

Run apps independently:

```bash
bun run dev:web      # frontend only
bun run dev:server   # backend only
```

## Testing

### Backend

```bash
cd apps/server && python -m pytest
```

Covers: alert CRUD, filtering by machine/anomaly/date, annotation validation (inactive reasons, cross-machine reasons), audit log entries.

### Frontend

```bash
cd apps/web && bun test
```

Covers: StatsCard rendering variants, SeverityBadge classification, alert list item display.

## Deployment

The frontend (TanStack Start / Nitro node-server preset) and backend (FastAPI) each run in a Docker container, orchestrated with Docker Compose. Traffic is routed via Cloudflare Tunnel — no public IP required. Secrets are injected at runtime from Infisical.

Currently deployed on a local server (GCP trial expired).

## Available Scripts

| Command                   | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `bun run dev`             | Start all apps (Turborepo, Infisical env injected)        |
| `bun run dev:web`         | Frontend only                                             |
| `bun run dev:server`      | Backend only                                              |
| `bun run build`           | Production build                                          |
| `bun run db:migrate`      | Apply pending Alembic migrations                          |
| `bun run seed`            | Seed machines, reasons, actions, dataset alerts           |
| `bun run seed:dev`        | As above + dev-only sample alerts                         |
| `bun run check`           | Run Oxlint + Oxfmt (lint and format fix)                  |
| `bun run check:types`     | TypeScript type check (all apps)                          |
| `bun run generate:client` | Regenerate OpenAPI TypeScript client from FastAPI spec    |
| `bun run deploy`          | Deploy frontend to Cloudflare Workers (Alchemy — legacy)  |
| `bun run destroy`         | Teardown Cloudflare Workers deployment (Alchemy — legacy) |

## Code Generation

The TypeScript API client (`apps/web/src/lib/api-client/`) is auto-generated from the FastAPI OpenAPI spec. Regenerate after backend schema changes:

```bash
bun run generate:client
```

CI verifies the generated client is in sync via `bun run verify:generated:client`.

## Database Migrations

Alembic manages all schema changes. The app startup flow does **not** call `SQLAlchemy.create_all()` — all schema evolution goes through migrations.

See [`apps/server/MIGRATION_GUIDE.md`](apps/server/MIGRATION_GUIDE.md) for the full Alembic workflow reference.

## Documentation

| Document                                                           | Contents                                           |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                     | Data model, API surface, frontend component map    |
| [`docs/data-pipeline.md`](docs/data-pipeline.md)                   | Dataset setup, seed strategy, audio/media pipeline |
| [`docs/settings-rollout.md`](docs/settings-rollout.md)             | Settings schema QA checklist and migration notes   |
| [`apps/server/MIGRATION_GUIDE.md`](apps/server/MIGRATION_GUIDE.md) | Alembic migration workflow                         |
