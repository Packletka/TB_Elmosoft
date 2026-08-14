# Base build stage
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
# best practice from the official uv documentation
ENV UV_LINK_MODE=copy

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Bottom layer
COPY pyproject.toml uv.lock ./

# Middle layer
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/ ./backend

# Top layer
#RUN uv sync --frozen --no-dev


# Production stage
FROM python:3.12-slim

RUN useradd -m -r appuser && \
    mkdir /app && \
    chown -R appuser /app

COPY --from=builder /app/.venv /app/.venv

ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY --chown=appuser:appuser . .

RUN chmod +x /app/compose/entrypoint.prod.sh 2>/dev/null || true

USER appuser

EXPOSE 8000

CMD ["/app/compose/entrypoint.prod.sh"]
