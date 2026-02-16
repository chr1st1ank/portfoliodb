# Docker Deployment

## Quick Start

Use Taskfile commands:

```bash
task docker-build              # Build image
task docker-run                # Run with in-memory database
task docker-run-persistent     # Run with persistent database
```

Or use Docker directly:

```bash
# Build
docker build -t portfoliodb .

# Run (in-memory)
docker run -p 8001:8001 -e DATABASE_URL=sqlite:file::memory:?cache=shared portfoliodb

# Run (persistent)
docker run -p 8001:8001 -v $(pwd)/data:/app/data -e DATABASE_URL=sqlite:///app/data/portfolio.db portfoliodb
```

Access at: http://localhost:8001

## Architecture

Single container runs both frontend and backend:
- Rust backend serves API at `/api/*`
- Frontend static files served at `/`
- Port 8001 (configurable via `PORT` env var)

## Environment Variables

| Variable       | Default                           | Description   |
|----------------|-----------------------------------|---------------|
| `DATABASE_URL` | `sqlite:///app/data/portfolio.db` | Database path |
| `PORT`         | `8001`                            | Server port   |
| `RUST_LOG`     | `info`                            | Log level     |

## Docker Compose

```yaml
services:
  portfoliodb:
    build: .
    ports:
      - "8001:8001"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///app/data/portfolio.db
```
