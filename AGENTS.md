# Repository Guidelines

## Project Overview

GroundUp AI is a fullstack monorepo for industrial anomaly monitoring. Operators review machine anomaly alerts, inspect audio, waveforms, and spectrograms, then annotate each alert with a suspected reason, remediation action, and comment.

The codebase is contract-first: the FastAPI backend defines the OpenAPI spec, and the frontend consumes a generated TypeScript client from `apps/web/src/lib/api-client/`.

Start with:

- `README.md` for setup and command overview
- `docs/architecture.md` for system/data-flow details
- `docs/data-pipeline.md` for dataset and media pipeline constraints
- `apps/server/MIGRATION_GUIDE.md` before changing database schema

## Architecture & Data Flow

### High-level structure

- `apps/web/`: React 19 + TanStack Start frontend, SSR, file-based routing
- `apps/server/`: FastAPI backend with async SQLAlchemy and Alembic
- `packages/env/`: shared env schema/validation for web and server
- `packages/config/`: shared TS config
- `packages/infra/`: Alchemy/Cloudflare deployment config

### Main data flow

1. Browser hits TanStack Start routes in `apps/web/src/routes/`.
2. Frontend query/mutation code in `apps/web/src/lib/query/` and `apps/web/src/lib/api/` calls the generated OpenAPI client.
3. FastAPI routes in `apps/server/app/api/routes/` execute business logic and persist relational data with SQLAlchemy.
4. PostgreSQL + TimescaleDB stores alerts, lookup tables, and audit history.
5. RustFS (S3-compatible) stores WAVs, waveform JSON, and spectrogram PNGs.

### Important domain patterns

- `Alert.status` is computed, not stored; see `docs/architecture.md`.
- Reasons are machine-scoped; actions are global.
- Alert annotations must validate active/in-scope lookup values.
- Waveform retrieval uses a three-tier cache: in-memory -> S3 JSON -> compute from WAV.
- Dashboard analytics come from TimescaleDB continuous aggregates, not ad hoc frontend math.

## Key Directories

- `apps/web/src/routes/`: TanStack Router route files such as `alerts.$alertId.tsx`, `settings.reasons.tsx`
- `apps/web/src/components/`: UI and feature components (`dashboard/`, `alerts/`)
- `apps/web/src/lib/api/`: API adapters and view-model shaping
- `apps/web/src/lib/query/`: TanStack Query options/loaders/mutations
- `apps/web/src/test/`: test setup, MSW utilities, render helpers
- `apps/server/app/api/routes/`: backend endpoint modules
- `apps/server/app/services/`: backend business logic, media/storage logic
- `apps/server/app/schemas/`: request/response schemas
- `apps/server/alembic/`: migrations only source of schema evolution
- `apps/server/tests/unit/`, `apps/server/tests/integration/`: backend unit/integration coverage
- `docs/`: architecture, data pipeline, rollout notes
- `scripts/`: repo-level utilities such as environment switching and client generation

## Development Commands

Run from repo root unless noted.

### Core workspace commands

- `bun install` — install JS workspace deps
- `bun run dev` — run web + server through Turbo with Infisical env injection
- `bun run dev:web` — frontend only
- `bun run dev:server` — backend only
- `bun run build` — workspace build
- `bun run test` — Turbo test across apps
- `bun run test:web` — web tests only
- `bun run test:server` — server tests only
- `bun run check:types` — workspace type checks
- `bun run check:lint` — workspace lint checks
- `bun run check` — Oxlint + Oxfmt autofix at root

### Backend-specific

- `bun run db:migrate` — apply Alembic migrations
- `bun run seed` — seed base dataset
- `bun run seed:dev` — seed base dataset plus dev-only records
- `uv run --directory apps/server pytest -v` — backend tests directly

### Frontend-specific

- `bun run --filter=web test` or `cd apps/web && bun run test` — Vitest suite
- `cd apps/web && bun run check:types` — frontend TS check

### Generated client

- `bun run generate:client` — regenerate frontend API client after backend API/schema changes
- `bun run verify:generated:client` — regenerate and fail on diff

### Environment switching

- `bun env:use dev|staging|prod` — rewrites root `package.json` `env:run` and `.infisical.json`
- `bun env:use` — print current environment

## Runtime / Tooling Preferences

- JS runtime and package manager: Bun (`packageManager: bun@1.3.9`)
- Python runtime: 3.13 via `uv`
- Monorepo orchestrator: Turbo
- Secrets: Infisical; do not introduce `.env` files
- Frontend lint/format: Oxlint + Oxfmt
- Backend lint/format: Ruff
- Backend typing: `ty`
- Git hooks: `lefthook`
- Local DB/service dependencies: Docker Compose / TimescaleDB

Assistant rules for this repo:

- Prefer root scripts over ad hoc commands.
- Preserve the Bun + UV split; frontend and shared TS live under Bun, backend under UV.
- Do not hand-edit generated client files in `apps/web/src/lib/api-client/`.
- Do not bypass Alembic with `create_all()`-style schema changes.
- Expect Infisical auth/connectivity for normal dev commands.

## Code Conventions & Common Patterns

### Frontend

- TanStack Start + TanStack Router file-based routes under `apps/web/src/routes/`
- TanStack Query is the default server-state layer; query options live in `apps/web/src/lib/query/`
- Tests use a shared QueryClient wrapper in `apps/web/src/test/test-utils.tsx`
- Prefer existing query-option and mutation-hook patterns over new fetch wrappers
- Coverage excludes generated files such as `src/lib/api-client/**` and `src/routeTree.gen.ts`

Example query pattern:

```ts
export const alertsQueryOptions = (filters: AlertFilters) =>
  queryOptions({
    queryKey: ["alerts", filters],
    queryFn: () => listAlertsApiV1AlertsGet({ query: filters }),
  });
```

### Backend

- FastAPI app is async; SQLAlchemy uses async sessions
- Route handlers live in `app/api/routes/`, not in model modules
- Request/response validation belongs in schema modules
- Tests patch storage and override DB session dependencies rather than hitting real object storage
- Migration workflow is strict: schema changes go through Alembic, then related seed/client/test updates

### Cross-cutting

- Contract-first is mandatory: backend API changes must be followed by generated client updates and affected frontend/test updates
- Historical snapshot fields on alerts are intentional; do not remove them casually
- Use documented domain rules from `docs/architecture.md` rather than inferring from UI labels

## Testing & QA

### Frameworks

- Frontend: Vitest + Testing Library + JSDOM (`apps/web/vitest.config.ts`)
- Backend: Pytest + pytest-asyncio + httpx ASGI transport (`apps/server/tests/`)
- CI: `.github/workflows/ci.yml`

### Test locations and patterns

- Frontend tests sit beside features, e.g. `apps/web/src/components/alerts/status-badge.test.tsx`
- Backend tests are split into:
  - `apps/server/tests/unit/`
  - `apps/server/tests/integration/`
- Backend integration tests rely on TimescaleDB and seeded fixtures from `apps/server/tests/conftest.py`
- Frontend test rendering should use `apps/web/src/test/test-utils.tsx` to get a QueryClientProvider

### Quality gates

CI runs in this order:

1. Frontend lint (`oxlint`) and TS typecheck
2. Backend lint (`ruff check`) and typecheck (`ty check`)
3. Frontend tests
4. Backend tests against TimescaleDB

Pre-commit hooks run:

- `bun oxlint --fix`
- `bun oxfmt --write`
- `uv run --directory apps/server ruff format app tests`
- `uv run --directory apps/server ruff check app tests`

## Important Files

- `package.json` — root scripts and workspace entry points
- `turbo.json` — workspace task graph
- `README.md` — setup, commands, architecture summary
- `docs/architecture.md` — authoritative domain/data-flow reference
- `docs/data-pipeline.md` — dataset, audio, cache, and seed workflow
- `apps/server/MIGRATION_GUIDE.md` — required migration workflow
- `apps/web/vitest.config.ts` — frontend test environment and coverage scope
- `apps/server/tests/conftest.py` — backend test fixtures, DB isolation, storage mocking
- `scripts/env-switch.ts` — environment switching behavior
- `lefthook.yml` — enforced pre-commit formatting/linting

## Common Assistant Workflows

### Changing backend API or schemas

1. Update backend routes/schemas/models/migrations.
2. Run `bun run db:migrate` if needed.
3. Regenerate the client with `bun run generate:client`.
4. Update frontend query/mutation consumers.
5. Update or add backend and frontend tests.

### Changing frontend data access

1. Check `apps/web/src/lib/api/` and `apps/web/src/lib/query/` for an existing pattern.
2. Reuse generated client functions instead of custom fetch code.
3. Add/adjust Vitest coverage near the feature.

### Changing database behavior

1. Read `apps/server/MIGRATION_GUIDE.md`.
2. Add an Alembic migration; do not rely on runtime schema creation.
3. Update seeds/tests/docs if the domain model changes.

## Caveats

- Normal development expects Infisical access at `https://infisical.zahid.es/api`.
- Dataset seeding depends on `../extracted_data/Fullstack Test/`, which is outside the repo.
- Local backend tests may require a running TimescaleDB instance if not using the CI service setup.
- Frontend build/dev may rely on generated local Alchemy/Cloudflare config in `.alchemy/`.
