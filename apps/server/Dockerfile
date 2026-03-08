FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

WORKDIR /app/apps/server

COPY --from=ghcr.io/astral-sh/uv:0.10.9 /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock
COPY apps/server/pyproject.toml /app/apps/server/pyproject.toml

RUN uv sync --frozen --no-install-project --no-dev

COPY apps/server /app/apps/server

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
