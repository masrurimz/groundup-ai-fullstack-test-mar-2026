# groundup-ai-fullstack-test-mar-2026

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), using React + TypeScript on the frontend and FastAPI on the backend.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **FastAPI** - Python backend API
- **Bun** - Runtime environment
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then run migrations and seed data:

```bash
bun run db:migrate
bun run seed:dev
```

Then start frontend + backend together:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:8000](http://localhost:8000).

## Dataset Source

- The backend reads the provided dataset from `../extracted_data/Fullstack Test` (parent directory of this repo).
- Expected files are `Test Dataset.xlsx` and the referenced wav files (`1.wav` ... `6.wav`).
- On seed, wav files are copied to `apps/server/data/audio` and used for waveform/spectrogram endpoints.

## Deployment (Cloudflare via Alchemy)

- Dev: cd apps/web && bun run alchemy dev
- Deploy: cd apps/web && bun run deploy
- Destroy: cd apps/web && bun run destroy

For more details, see the guide on [Deploying to Cloudflare with Alchemy](https://www.better-t-stack.dev/docs/guides/cloudflare-alchemy).

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
groundup-ai-fullstack-test-mar-2026/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
│   └── server/      # Backend API (FastAPI)
├── packages/
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run db:migrate`: Run backend database migrations
- `bun run seed`: Seed lookup + dataset alerts
- `bun run seed:dev`: Seed lookup + dataset alerts + dev-only sample alerts
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Oxlint and Oxfmt

## Settings Configuration Flow

- Settings are managed under `/settings` pages in the web app:
  - `/settings/machines`
  - `/settings/reasons`
  - `/settings/actions`
- Alert detail editing uses ID-based lookup values (machine-scoped reasons + global actions).
- Additional rollout and QA notes are documented in [`docs/settings-rollout.md`](docs/settings-rollout.md).

## Tailscale Access

- Backend runs on `0.0.0.0:8000` and frontend on `0.0.0.0:3001` in dev mode.
- Set `apps/server/.env` with `CORS_ORIGINS` including your Tailscale web origin (for example `http://your-machine.your-tailnet.ts.net:3001`).
- Set `apps/web/.env` `VITE_SERVER_URL` to your backend URL (for example `http://your-machine.your-tailnet.ts.net:8000`) when testing from your Mac.
