# PortfolioDB Rust Backend

A high-performance rewrite of the PortfolioDB backend in Rust using Axum, SQLx, and Tokio.

## Status

**Phase 1: Foundation - COMPLETED ✅**

The basic server infrastructure is now operational with:
- ✅ Project structure and configuration
- ✅ Database models for all 5 core entities
- ✅ Repository layer with CRUD operations
- ✅ Basic Axum server with Investment API endpoints
- ✅ Error handling and logging
- ✅ SQLite database integration (reusing existing database)

## Quick Start

### Prerequisites

- Rust 1.83.0 or later
- Existing SQLite database at `../backend/db.sqlite3`

### Setup

1. Copy environment configuration:
```bash
cp .env.example .env
```

2. Build the project:
```bash
cargo build --release
```

3. Run the server:
```bash
cargo run
```

The server will start on `http://127.0.0.1:8001` by default.

### Configuration

Environment variables (`.env` file):
- `DATABASE_URL` - SQLite database path (default: `sqlite:../backend/db.sqlite3`)
- `HOST` - Server host (default: `127.0.0.1`)
- `PORT` - Server port (default: `8001`)
- `RUST_LOG` - Logging level (default: `info,portfoliodb_rust=debug`)

## API Endpoints

### Investments

- `GET /api/investments` - List all investments
- `GET /api/investments/:id` - Get investment by ID
- `POST /api/investments` - Create new investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment

### Example Request

```bash
curl http://127.0.0.1:8001/api/investments
```

## Project Structure

```
backend-rust/
├── src/
│   ├── main.rs              # Application entry point
│   ├── config.rs            # Configuration management
│   ├── error.rs             # Error types and handling
│   ├── routes.rs            # API route definitions
│   ├── models/              # Database models
│   │   ├── mod.rs
│   │   ├── settings.rs
│   │   ├── action_type.rs
│   │   ├── investment.rs
│   │   ├── investment_price.rs
│   │   └── movement.rs
│   ├── repository/          # Data access layer
│   │   ├── mod.rs
│   │   ├── settings.rs
│   │   ├── action_type.rs
│   │   ├── investment.rs
│   │   ├── investment_price.rs
│   │   └── movement.rs
│   └── handlers/            # HTTP request handlers
│       ├── mod.rs
│       └── investments.rs
├── Cargo.toml               # Dependencies
├── .env.example             # Environment template
└── README.md                # This file
```

## Technology Stack

- **Web Framework**: Axum 0.7
- **Async Runtime**: Tokio 1.x
- **Database**: SQLx 0.8 with SQLite
- **Serialization**: Serde
- **HTTP Client**: Reqwest 0.12
- **HTML Parsing**: Scraper 0.20
- **Logging**: Tracing + Tracing Subscriber
- **Error Handling**: Anyhow + Thiserror

## Database Schema

The Rust backend reuses the existing Django SQLite database with the following models:

- **Settings** - Application settings (base currency)
- **ActionType** - Transaction types (buy, sell, etc.)
- **Investment** - Investment instruments (stocks, ETFs, funds)
- **InvestmentPrice** - Historical price data
- **Movement** - Portfolio transactions

## Next Steps (Phase 2)

- [ ] Implement Movement and InvestmentPrice API endpoints
- [ ] Add date range filtering for investment prices
- [ ] Implement portfolio development calculations
- [ ] Add quote fetching service
- [ ] Implement currency conversion service
- [ ] Add comprehensive error handling
- [ ] Write unit and integration tests

## Development

### Build for Development
```bash
cargo build
```

### Run Tests
```bash
cargo test
```

### Check Code
```bash
cargo check
```

### Format Code
```bash
cargo fmt
```

### Lint Code
```bash
cargo clippy
```

## Performance Notes

- Uses async/await for non-blocking I/O
- Connection pooling via SQLx
- Compiled to native code for maximum performance
- Single binary deployment (no runtime dependencies)

## Compatibility

The Rust backend is designed to be API-compatible with the existing Django backend, allowing for gradual migration or A/B testing.
