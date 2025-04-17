FROM python:3.13-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.6.12 /uv /uvx /bin/
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

RUN --mount=type=bind,src=backend/pyproject.toml,target=pyproject.toml \
    --mount=type=bind,src=backend/uv.lock,target=uv.lock \
    uv export --frozen --no-hashes \
    | uv pip install --no-break-system-packages --system --requirements -

COPY backend /app

EXPOSE 8000

RUN uv run python -c "import django"

CMD ["sh", "-c", "uv run python manage.py migrate --noinput && uv run python manage.py runserver 0.0.0.0:8000"]
