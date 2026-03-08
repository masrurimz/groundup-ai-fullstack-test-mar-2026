# Settings Schema V2 Rollout Notes

## Scope

This release introduces the settings-oriented schema/API/UI flow for machine, reason, and action configuration.

## Backend Changes

1. Added schema v2 migration `1f0f7c9f4a21` with no-backfill strategy.
2. Introduced `machines` and `audit_log` tables.
3. Reworked `reasons` and `actions` with normalized keys and `is_active` support.
4. Extended alerts with `machine_id`, `suspected_reason_id`, `action_id`, `updated_at`, and `updated_by`.
5. Upgraded lookup APIs to support create/update with active-state toggles.
6. Upgraded alert patch API to ID-based updates with machine/reason/action validation.

## Frontend Changes

1. Header settings entrypoint now routes to `/settings` pages.
2. Settings are managed via dedicated pages: machines, reasons, and actions.
3. Alert detail edit form now uses dynamic lookup data and ID-based save payloads.
4. TanStack Query is used for server state and mutation invalidation flow.
5. TanStack Form is used for form state and validation flows.

## Legacy Path Guidance

1. `/api/v1/lookup` remains available as an aggregator endpoint for compatibility.
2. `/api/v1/lookup/reasons` still supports the legacy `machine` query param for backward compatibility.
3. New integrations should prefer `machine_id` where possible.

## QA Checklist (Manual)

1. Open `/settings/machines`, create a machine, and verify it appears immediately.
2. Toggle machine active state and verify state persists after refresh.
3. Open `/settings/reasons`, select machine, create reason, and verify list refresh.
4. Toggle reason active state and verify it can be re-enabled.
5. Open `/settings/actions`, create and toggle action state.
6. Open alert detail page, verify reason options are machine-scoped.
7. Update alert reason/action/comment and confirm values persist on reload.
8. Verify inactive reasons/actions are rejected by backend when selected via crafted API call.

## Verification Summary

1. Backend checks: `ruff check`, `pytest` passing for updated schema/API tests.
2. Migration check: `alembic upgrade head` verified on sqlite temp DB.
3. Frontend build requires generated Alchemy local config (`.alchemy/local/wrangler.jsonc`) and may fail in environments where it is not present.
