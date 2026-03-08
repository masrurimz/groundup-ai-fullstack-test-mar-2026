# Alembic Migration Guide

This guide documents the Alembic workflow for managing database schema changes in GroundUp AI.

## Setup

Alembic is configured in `alembic.ini` and uses the `alembic/` directory structure. The environment configuration loads models from `app.models.Base` for automatic migration detection.

**Database URL**: Configured in `app/core/config.py` and referenced in `alembic.ini`

## Common Commands

### Apply Migrations to Current Database

```bash
uv run alembic upgrade head
```

Applies all pending migrations to bring the database to the latest schema version.

### View Pending Migrations

```bash
uv run alembic upgrade head --sql
```

Generates and prints SQL without executing (dry run).

### Downgrade to Previous Version

```bash
uv run alembic downgrade -1
```

Rolls back the last applied migration. To downgrade to a specific revision:

```bash
uv run alembic downgrade 69333faeabcc
```

### Generate a New Migration from Model Changes

After adding or modifying models in `app/models.py`:

```bash
uv run alembic revision --autogenerate -m "Describe your changes"
```

Review the generated migration file in `alembic/versions/` before applying.

### Check Migration History

```bash
uv run alembic current
```

Shows the currently applied migration revision.

```bash
uv run alembic history
```

Lists all migrations in order.

## Applied Migrations

### Initial migration (`69333faeabcc`)

- **alerts**: Machine anomaly alerts with timestamp, sensor, machine ID, and optional analysis fields
- **reasons**: Predefined anomaly reasons indexed by machine
- **actions**: Recommended remediation actions

### Schema v2 migration (`1f0f7c9f4a21`)

- Adds **machines** catalog and **audit_log** tables
- Rebuilds **reasons** and **actions** with normalized keys and `is_active` flags
- Extends **alerts** with `machine_id`, `suspected_reason_id`, `action_id`, `updated_at`, `updated_by`
- Adds indexes for alert lookup ID fields

This migration is intentionally **no-backfill**. Because this project currently has no production data, we avoid one-off reconciliation logic and rely on deterministic seeding for fresh environments.

## Seed Strategy For V2

- `bootstrap.py` now seeds machines first, then machine-scoped reasons, then global actions
- alert seed rows include both machine snapshot text (`machine`) and foreign keys (`machine_id`)
- reason/action text snapshot columns on alerts remain for historical readability

## Async SQLAlchemy Integration

The `alembic/env.py` file is configured for async SQLAlchemy:

- Uses `asyncio.run()` to execute migrations with async engines
- Automatically imports metadata from `app.models.Base`
- Compares types and server defaults for accurate diffs

## Key Principles

1. **No create_all in production**: The app startup flow does NOT call `SQLAlchemy.create_all()`. All schema changes go through Alembic.
2. **No backfill when unnecessary**: For pre-production schema pivots, prefer clean migrations + seed updates over fragile backfill logic.
3. **Automatic model detection**: Changes to models in `app/models.py` are automatically detected during `alembic revision --autogenerate`
4. **Type awareness**: Alembic compares column types and maintains PostgreSQL-specific details (e.g., timezone handling)

## Troubleshooting

**"Failed to load target metadata"**: Ensure models are properly defined in `app/models.py` with `Base` as DeclarativeBase

**"Could not locate a collection to handle 'metadata' in registry"**: Check that all models inherit from `Base` (DeclarativeBase)

**Database connection errors**: Verify `DATABASE_URL` in `app/core/config.py` and that the PostgreSQL server is running
