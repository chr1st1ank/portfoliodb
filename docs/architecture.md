# Project Description: **Portfolio Tracker**

## Goal

A web-based tool for managing and analyzing a private securities portfolio. It enables the import of PDF transactions (e.g., from Flatex), stores data persistently, displays the performance of individual securities as well as the overall portfolio graphically, and updates price data regularly via web scraping.

## Main Features

### Portfolio Analysis

- Overall portfolio development including deposits/withdrawals
- Display of historical performance of individual securities
- Charts (e.g., line, bar, or pie charts) for visualization

### Transactions

- Upload of PDF documents (e.g., buy/sell from Flatex)
- Parsing and extraction of transaction data (date, ISIN, quantity, price, fees, etc.)
- Ability to manually correct and supplement via web UI or admin interface

### Price Updates

- Daily retrieval of current prices via web scraping (e.g., from bank website)
- Automatically via cron job or scheduled background task

### Frontend

- Modern React app with clean UI
- Clear presentation of transactions, performance, portfolio composition

### Data Storage

- Local SQLite database
- Persistent storage of all transactions and prices
- No user management necessary (single-user)

## Architecture

- **Backend**: Django + Django REST Framework (legacy) / Rust + Axum (new)
- **Frontend**: React + Vite + Tailwind + Chart.js/Recharts
- **Deployment**: Can be started locally, optionally as Docker container for server operation

## Code Structure

### Project Root

```plaintext
/portfoliodb2
├── backend/           # Django backend application
├── docs/              # Project documentation
├── frontend/          # React frontend application
├── local/             # Local development files
├── .dockerignore      # Docker ignore file
├── .gitignore         # Git ignore file
├── Dockerfile         # Docker configuration
└── Taskfile.yaml      # Task runner configuration
```

### Backend Structure

```plaintext
/backend
├── core/                  # Main Django application
│   ├── fixtures/          # Sample and test data
│   ├── migrations/        # Database migrations
│   ├── tests/             # Unit tests
│   ├── admin.py           # Django admin configuration
│   ├── apps.py            # Django app configuration
│   ├── models.py          # Database models
│   ├── serializers.py     # REST API serializers
│   ├── table_calculations.py # Portfolio calculation logic
│   └── views.py           # API endpoints
├── portfoliodb/           # Django project settings
│   ├── settings.py        # Project settings
│   ├── urls.py            # URL routing
│   ├── asgi.py            # ASGI configuration
│   └── wsgi.py            # WSGI configuration
├── manage.py              # Django management script
└── pyproject.toml         # Python dependencies
```

### Frontend Structure

```plaintext
/frontend
├── public/                # Static public assets
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── InvestmentDetail.tsx    # Individual investment details
│   │   ├── Investments.tsx         # Investment management
│   │   ├── InvestmentsWrapper.tsx  # Container for investments
│   │   ├── Movements.tsx           # Portfolio movements
│   │   ├── MovementsWrapper.tsx    # Container for movements
│   │   ├── PerformanceChart.tsx    # Performance visualization
│   │   ├── PortfolioComposition.tsx # Portfolio composition view
│   │   ├── PortfolioDashboard.tsx  # Main dashboard component
│   │   ├── PortfolioTable.tsx      # Tabular portfolio data
│   │   └── ThemeToggle.tsx         # Dark/light mode toggle
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main application component
│   ├── theme.ts           # UI theme configuration
│   └── main.tsx           # Application entry point
├── index.html             # HTML entry point
├── package.json           # NPM dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite bundler configuration
```

### Data Flow

1. **User Interaction**: Users interact with React components in the frontend
2. **API Requests**: Frontend services make API calls to the Django backend
3. **Data Processing**: Backend processes requests using models and business logic
4. **Database Operations**: Core models interact with SQLite database
5. **Response**: Processed data is serialized and returned to the frontend
6. **Rendering**: Frontend components render the updated data

### Development Workflow

- Backend development uses Django's development server or Rust backend
- Frontend development uses Vite's development server
- Tasks are managed using Taskfile.yaml for common operations
- Dependencies are managed with uv for Python and npm for JavaScript

## Rust Backend

### Overview

The Rust backend is a modern rewrite of the Django backend using:
- **Axum** - Web framework
- **SQLx** - Type-safe SQL with compile-time verification
- **SQLite** - Shared database with Django backend
- **Tokio** - Async runtime

**Key Features:**
- Trait-based repository pattern for database abstraction
- Type-safe operations with compile-time guarantees
- Async/await for non-blocking I/O
- Quote fetching from Yahoo Finance and JustETF
- Currency conversion via Frankfurter API
- Portfolio development calculations

### Structure

```plaintext
/backend-rust
├── src/
│   ├── db/                    # Database layer
│   │   ├── repository/        # Repository traits and implementations
│   │   └── schema.sql         # Database schema
│   ├── dto/                   # Data transfer objects
│   ├── handlers/              # API endpoint handlers
│   ├── services/              # Business logic
│   │   ├── portfolio_calculator.rs
│   │   ├── quote_fetcher.rs
│   │   └── currency_converter.rs
│   ├── config.rs              # Configuration
│   ├── error.rs               # Error handling
│   └── lib.rs                 # Library exports
├── tests/                     # Integration tests
└── Cargo.toml                 # Rust dependencies
```

### API Endpoints

**Investments:** `GET/POST/PUT/DELETE /api/investments`  
**Movements:** `GET/POST/PUT/DELETE /api/movements`  
**Investment Prices:** `GET/POST /api/investmentprices`, `POST /api/investmentprices/upsert`  
**Action Types:** `GET /api/actiontypes`  
**Settings:** `GET/PUT /api/settings`  
**Developments:** `GET /api/developments` (portfolio calculations)  
**Quotes:** `GET /api/quotes/providers`, `POST /api/quotes/fetch`

### Development Commands

Use task commands (defined in Taskfile.yaml):

```bash
task rust-build          # Build debug version
task rust-build-release  # Build optimized release
task rust-run            # Start server (http://localhost:8001)
task rust-test           # Run all tests
task rust-test-unit      # Run unit tests only
task rust-check          # Quick syntax check
task rust-clean          # Clean build artifacts
```

### Testing

**Test Coverage:**
- 37 total tests (6 unit, 31 integration)
- Repository integration tests with in-memory SQLite
- Portfolio calculator business logic tests
- Mock implementations for isolated testing

**Run tests:**
```bash
task rust-test              # All tests
task rust-test-unit         # Unit tests only
task rust-test-integration  # Integration tests only
```

### Repository Pattern

Uses trait-based abstraction for database operations:

```rust
#[async_trait]
pub trait InvestmentRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<Investment>>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Investment>>;
    async fn create(&self, investment: &Investment) -> Result<i64>;
    async fn update(&self, id: i64, investment: &Investment) -> Result<()>;
    async fn delete(&self, id: i64) -> Result<()>;
}
```

Handlers depend on traits (not concrete implementations), enabling:
- Database flexibility (can swap SQLite for PostgreSQL)
- Easy testing with mock implementations
- Clean separation of concerns
