# GroundUp AI — Industrial Anomaly Monitoring

A fullstack web application for monitoring industrial machine anomaly alerts. Operators review audio recordings of anomalous machine outputs, examine waveforms and spectrograms, and annotate each alert with a suspected reason, remediation action, and comment. Machine, reason, and action catalogs are managed through a dedicated settings interface.

## What It Does

| Area         | Description                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Dashboard    | Live stats (machine count, average uptime, active/critical alerts) + machine health breakdown + recent alerts table |
| Alerts list  | Filterable sidebar list by machine, anomaly type, and date range                                                    |
| Alert detail | Side-by-side anomaly panel (audio player, waveform, spectrogram) + editable annotation form                         |
| Settings     | CRUD management for machines, machine-scoped reasons, and global actions — all with active-state toggling           |

## Tech Stack

| Layer      | Technology                                                                     |
| ---------- | ------------------------------------------------------------------------------ |
| Frontend   | React 19, TanStack Start (SSR), TanStack Router, TanStack Query, TanStack Form |
| UI         | Tailwind CSS v4, shadcn/ui, Base UI                                            |
| Backend    | FastAPI, SQLAlchemy async, Alembic, Python 3.13                                |
| Database   | SQLite (dev), PostgreSQL (prod)                                                |
| Monorepo   | Turborepo, Bun 1.3.9                                                           |
| Deployment | Cloudflare Workers via Alchemy                                                 |
| Secrets    | Infisical (self-hosted)                                                        |
| Linting    | Oxlint + Oxfmt                                                                 |

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

## Available Scripts

| Command                   | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `bun run dev`             | Start all apps (Turborepo, Infisical env injected)     |
| `bun run dev:web`         | Frontend only                                          |
| `bun run dev:server`      | Backend only                                           |
| `bun run build`           | Production build                                       |
| `bun run db:migrate`      | Apply pending Alembic migrations                       |
| `bun run seed`            | Seed machines, reasons, actions, dataset alerts        |
| `bun run seed:dev`        | As above + dev-only sample alerts                      |
| `bun run check`           | Run Oxlint + Oxfmt (lint and format fix)               |
| `bun run check:types`     | TypeScript type check (all apps)                       |
| `bun run generate-client` | Regenerate OpenAPI TypeScript client from FastAPI spec |
| `bun run deploy`          | Deploy frontend to Cloudflare Workers                  |
| `bun run destroy`         | Teardown Cloudflare Workers deployment                 |

## Database Migrations

Alembic manages all schema changes. The app startup flow does **not** call `SQLAlchemy.create_all()` — all schema evolution goes through migrations.

See [`apps/server/MIGRATION_GUIDE.md`](apps/server/MIGRATION_GUIDE.md) for the full Alembic workflow reference.

## Deployment

Frontend deploys to Cloudflare Workers via [Alchemy](https://github.com/sam-goodwin/alchemy). Deployment requires a locally generated Alchemy config (`.alchemy/local/wrangler.jsonc`).

```bash
bun run deploy    # deploy
bun run destroy   # teardown
```

The backend is not deployed via Alchemy — host it separately (e.g., a VPS, Railway, or Fly.io) with a PostgreSQL `DATABASE_URL` set in Infisical under the target environment.

## Code Generation

The TypeScript API client (`apps/web/src/lib/api-client/`) is auto-generated from the FastAPI OpenAPI spec. Regenerate after backend schema changes:

```bash
bun run generate-client
```

CI verifies the generated client is in sync via `bun run verify-generated-client`.

## Reference Docs

| Document                                                           | Contents                                           |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md)                     | Data model, API surface, frontend component map    |
| [`docs/data-pipeline.md`](docs/data-pipeline.md)                   | Dataset setup, seed strategy, audio/media pipeline |
| [`docs/settings-rollout.md`](docs/settings-rollout.md)             | Settings schema QA checklist and migration notes   |
| [`apps/server/MIGRATION_GUIDE.md`](apps/server/MIGRATION_GUIDE.md) | Alembic migration workflow                         |
