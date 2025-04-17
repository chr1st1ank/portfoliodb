FROM python:3.13-slim

WORKDIR /app

# System deps for build and PDF parsing
# RUN apt-get update && apt-get install -y build-essential libmagic1 && rm -rf /var/lib/apt/lists/*

# Install uv for dependency management
COPY --from=ghcr.io/astral-sh/uv:0.6.12 /uv /uvx /bin/
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

# Install dependencies including specified "extras"
RUN --mount=type=cache,target=/root/.cache \
    --mount=type=bind,src=backend/pyproject.toml,target=pyproject.toml \
    --mount=type=bind,src=backend/uv.lock,target=uv.lock \
    uv export --frozen --no-hashes \
    | uv pip install --no-break-system-packages --system --requirements -

COPY backend /app

# Expose development port
EXPOSE 8000

# Migrate and run development server
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]