FROM node:25-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

FROM rust:bookworm AS backend-builder

WORKDIR /build

COPY backend-rust/Cargo.toml backend-rust/Cargo.lock ./
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

COPY backend-rust/src ./src
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /build/target/release/portfoliodb-rust ./portfoliodb-rust
COPY --from=frontend-builder /frontend/dist ./static

RUN mkdir -p data

ENV DATABASE_URL=sqlite:///app/data/portfolio.db \
    HOST=0.0.0.0 \
    PORT=8001 \
    RUST_LOG=info

EXPOSE 8001

CMD ["./portfoliodb-rust"]
