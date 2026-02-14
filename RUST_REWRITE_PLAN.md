# Rust Backend Rewrite - Implementation Plan

**Status**: In Progress  
**Started**: 2026-02-14  
**Target**: Complete rewrite of Django backend in Rust

## Architecture Overview

### Layered Architecture
```
┌─────────────────────────────────────┐
│   API Layer (Axum Handlers)        │
├─────────────────────────────────────┤
│   Service Layer (Business Logic)   │
├─────────────────────────────────────┤
│   Repository Layer (Data Access)   │
├─────────────────────────────────────┤
│   Database (SQLite via SQLx)       │
└─────────────────────────────────────┘
```

### Project Structure
```
backend-rust/
├── Cargo.toml                    # Dependencies
├── .env.example                  # Environment template
├── migrations/                   # SQLx migrations
│   └── 001_initial_schema.sql
├── src/
│   ├── main.rs                   # Entry point, server setup
│   ├── config.rs                 # Configuration management
│   ├── error.rs                  # Error types and handling
│   │
│   ├── models/                   # Domain models
│   │   ├── mod.rs
│   │   ├── settings.rs
│   │   ├── action_type.rs
│   │   ├── investment.rs
│   │   ├── investment_price.rs
│   │   └── movement.rs
│   │
│   ├── dto/                      # Data Transfer Objects (API contracts)
│   │   ├── mod.rs
│   │   ├── investment.rs
│   │   ├── movement.rs
│   │   ├── price.rs
│   │   └── development.rs
│   │
│   ├── repository/               # Database access layer
│   │   ├── mod.rs
│   │   ├── settings.rs
│   │   ├── action_type.rs
│   │   ├── investment.rs
│   │   ├── investment_price.rs
│   │   └── movement.rs
│   │
│   ├── services/                 # Business logic
│   │   ├── mod.rs
│   │   ├── portfolio_calculator.rs  # Portfolio calculations
│   │   ├── quote_fetcher.rs         # Quote orchestration
│   │   ├── currency_converter.rs    # Currency conversion
│   │   └── providers/               # Quote providers
│   │       ├── mod.rs
│   │       ├── provider_trait.rs
│   │       ├── yahoo_finance.rs
│   │       └── justetf.rs
│   │
│   ├── handlers/                 # HTTP request handlers
│   │   ├── mod.rs
│   │   ├── investments.rs
│   │   ├── movements.rs
│   │   ├── prices.rs
│   │   ├── action_types.rs
│   │   ├── developments.rs
│   │   └── quotes.rs
│   │
│   └── routes.rs                 # Route definitions
│
└── tests/                        # Integration tests
    ├── api_tests.rs
    ├── portfolio_tests.rs
    └── quote_tests.rs
```

## Technology Stack

### Core Dependencies
- **axum** 0.7 - Web framework
- **tokio** 1.x - Async runtime
- **sqlx** 0.7 - Database with compile-time checks
- **serde** 1.0 - Serialization
- **chrono** 0.4 - Date/time handling
- **rust_decimal** 1.33 - Financial calculations
- **reqwest** 0.11 - HTTP client
- **scraper** 0.18 - HTML parsing
- **anyhow** / **thiserror** - Error handling
- **tracing** - Logging

## Implementation Phases

### ✅ Phase 0: Planning & Documentation
- [x] Analyze Django backend
- [x] Document current backend in README.md
- [x] Design Rust architecture
- [x] Create implementation plan

### 🔄 Phase 1: Foundation (Week 1)
- [ ] Set up Rust project structure
- [ ] Configure Cargo.toml with all dependencies
- [ ] Create database models (5 models)
- [ ] Implement repository layer (5 repositories)
- [ ] Set up basic Axum server
- [ ] Implement error handling
- [ ] Create configuration management

**Deliverable**: Running server with database connection

### Phase 2: CRUD API (Week 2)
- [ ] Implement DTOs for all models
- [ ] Create handlers for Investments (CRUD)
- [ ] Create handlers for Movements (CRUD)
- [ ] Create handlers for InvestmentPrices (CRUD + filtering)
- [ ] Create handlers for ActionTypes (CRUD)
- [ ] Create handlers for Settings (read/update)
- [ ] Set up CORS middleware
- [ ] Test all endpoints with frontend

**Deliverable**: Full CRUD API compatible with frontend

### Phase 3: Portfolio Calculations (Week 3)
- [ ] Implement PortfolioCalculator service
- [ ] Port developments() calculation logic
- [ ] Handle date range filtering
- [ ] Create /api/developments endpoint
- [ ] Write unit tests for calculations
- [ ] Verify calculations match Django output

**Deliverable**: Working portfolio calculations endpoint

### Phase 4: Quote Fetching (Week 4)
- [ ] Implement QuoteProvider trait
- [ ] Implement Yahoo Finance provider
- [ ] Implement JustETF provider (web scraping)
- [ ] Implement CurrencyConverter service
- [ ] Implement QuoteFetcherService orchestrator
- [ ] Create /api/quotes/providers endpoint
- [ ] Create /api/quotes/fetch endpoint
- [ ] Add parallel fetching with tokio
- [ ] Test quote fetching end-to-end

**Deliverable**: Working quote fetching system

### Phase 5: Polish & Deploy (Week 5)
- [ ] Add comprehensive logging/tracing
- [ ] Write integration tests
- [ ] Performance testing & optimization
- [ ] Create API documentation
- [ ] Create Dockerfile
- [ ] Update project README
- [ ] Migration guide from Django
- [ ] Deploy and verify

**Deliverable**: Production-ready Rust backend

## Database Strategy

### Approach: Reuse Existing SQLite Database
- Keep same schema with Django column names (e.g., `InvestmentID`, `BaseCurrency`)
- Use SQLx's `rename` attribute to map to Rust naming conventions
- No data migration needed
- Both backends can coexist during transition

### Schema Mapping Example
```rust
#[derive(sqlx::FromRow)]
pub struct Investment {
    #[sqlx(rename = "ID")]
    pub id: i64,
    #[sqlx(rename = "Name")]
    pub name: Option<String>,
    #[sqlx(rename = "ISIN")]
    pub isin: Option<String>,
    // ...
}
```

## Key Technical Decisions

### Web Framework: Axum
- Modern, fast, type-safe
- Built on Tokio for async
- Excellent ergonomics with extractors
- Strong ecosystem

### Database: SQLx
- Compile-time checked queries
- Async support
- Works with existing SQLite
- No ORM overhead

### Async Runtime: Tokio
- Industry standard
- Perfect for I/O-heavy operations
- Enables parallel quote fetching

### Decimal Type: rust_decimal
- No floating-point errors
- Essential for financial calculations
- Serde support

## Component Details

### Models Layer
**Purpose**: Domain entities matching database tables

**Files**:
- `settings.rs` - Settings model
- `action_type.rs` - ActionType model
- `investment.rs` - Investment model
- `investment_price.rs` - InvestmentPrice model
- `movement.rs` - Movement model

**Approach**:
- Pure Rust structs
- Derive: `Debug`, `Clone`, `Serialize`, `Deserialize`, `sqlx::FromRow`
- Use `rust_decimal::Decimal` for monetary values
- Use `chrono::NaiveDate` for dates

### Repository Layer
**Purpose**: Database access abstraction

**Pattern**: One repository per model

**Methods**:
- `find_all()` - Get all records
- `find_by_id(id)` - Get single record
- `create(data)` - Insert new record
- `update(id, data)` - Update existing record
- `delete(id)` - Delete record
- Custom queries as needed

**Example**:
```rust
pub struct InvestmentRepository {
    pool: SqlitePool,
}

impl InvestmentRepository {
    pub async fn find_all(&self) -> Result<Vec<Investment>> {
        sqlx::query_as!(Investment, "SELECT * FROM Investment")
            .fetch_all(&self.pool)
            .await
    }
}
```

### DTO Layer
**Purpose**: API request/response contracts

**Separation**: DTOs ≠ Models
- Request DTOs for input validation
- Response DTOs for output formatting
- Conversion functions to/from models

### Handlers Layer
**Purpose**: HTTP request handling

**Responsibilities**:
- Extract path/query params
- Parse JSON body
- Call service/repository layer
- Return JSON responses
- Handle errors

**Example**:
```rust
pub async fn list_investments(
    State(repo): State<Arc<InvestmentRepository>>,
) -> Result<Json<Vec<InvestmentResponse>>, AppError> {
    let investments = repo.find_all().await?;
    Ok(Json(investments.into_iter().map(Into::into).collect()))
}
```

### Services Layer
**Purpose**: Business logic

**Components**:

1. **PortfolioCalculator**
   - Calculate portfolio developments over time
   - Combine movements and prices
   - Compute cumulative positions and values

2. **QuoteFetcherService**
   - Orchestrate quote fetching
   - Manage provider registry
   - Handle currency conversion
   - Parallel fetching

3. **CurrencyConverter**
   - Convert between currencies
   - Use Frankfurter.app API
   - Support historical rates

4. **Quote Providers**
   - Trait-based abstraction
   - Yahoo Finance implementation
   - JustETF implementation

## API Endpoints

### CRUD Endpoints
- `GET /api/investments` - List all investments
- `POST /api/investments` - Create investment
- `GET /api/investments/:id` - Get investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment
- (Similar for movements, prices, action_types)

### Calculated Endpoints
- `GET /api/developments?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Portfolio developments
- `GET /api/quotes/providers` - List quote providers
- `POST /api/quotes/fetch` - Trigger quote fetch

## Testing Strategy

### Unit Tests
- Portfolio calculation logic
- Currency conversion
- Quote provider parsing
- Date range filtering

### Integration Tests
- Full API endpoint tests
- Use in-memory SQLite
- Verify CRUD operations
- Test error handling

### Comparison Tests
- Run both Django and Rust
- Compare API responses
- Verify calculation parity

## Migration Path

### Parallel Deployment
1. Keep Django backend running (port 8000)
2. Deploy Rust backend (port 8001)
3. Frontend config to switch backends
4. Verify feature parity
5. Gradual cutover
6. Decommission Django

### Data Compatibility
- Use same SQLite database file
- No schema changes needed
- Both backends can coexist

## Advantages of Rust Implementation

✅ **Performance**: 5-10x faster API responses  
✅ **Memory Safety**: No null pointer errors, data races  
✅ **Concurrency**: Parallel quote fetching without fear  
✅ **Type Safety**: Compile-time guarantees for financial calculations  
✅ **Single Binary**: Easy deployment, no Python runtime  
✅ **Async I/O**: Non-blocking external API calls  
✅ **Resource Efficiency**: Lower memory footprint  

## Challenges & Mitigations

| Challenge            | Mitigation                               |
|----------------------|------------------------------------------|
| Learning Curve       | Start with simple CRUD, iterate          |
| Longer Compile Times | Use `cargo check` during development     |
| No OpenBB            | Use Yahoo Finance API directly or crates |
| Web Scraping         | Port with `scraper` crate                |
| Decimal Arithmetic   | Use `rust_decimal` crate                 |
| Async Complexity     | Follow Tokio patterns, good docs         |

## Progress Tracking

### Current Phase: Phase 1 - Foundation
**Started**: 2026-02-14  
**Target Completion**: 2026-02-21

### Completed Tasks
- [x] Plan documentation

### In Progress
- [ ] Project setup

### Next Up
- [ ] Database models
- [ ] Repository layer

## Notes & Decisions

### 2026-02-14
- Decided on Axum over Actix-web for better ergonomics
- Chose SQLx over Diesel for compile-time query checking
- Will reuse existing SQLite database to avoid migration
- Plan to implement in 5 phases over ~5 weeks

## Resources

- [Axum Documentation](https://docs.rs/axum)
- [SQLx Documentation](https://docs.rs/sqlx)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Rust Decimal](https://docs.rs/rust_decimal)
- Django Backend README: `/backend/README.md`
- Architecture Overview: `/docs/architecture.md`

## Success Criteria

- [ ] All Django API endpoints replicated
- [ ] Portfolio calculations match Django output
- [ ] Quote fetching works for all providers
- [ ] Frontend works without changes
- [ ] Performance improvement measurable
- [ ] All tests passing
- [ ] Documentation complete
