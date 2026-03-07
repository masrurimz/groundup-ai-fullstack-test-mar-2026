#!/usr/bin/env bash

set -euo pipefail

uv run --directory apps/server python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > apps/web/openapi.json
bun run --filter web generate-client
rm -f apps/web/openapi.json
