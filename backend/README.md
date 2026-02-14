# PortfolioDB Backend

Django REST Framework backend for managing and analyzing a private securities portfolio.

## Overview

A REST API backend that handles portfolio transactions, investment tracking, price data management, and portfolio performance calculations. Designed for single-user deployment with SQLite database.

## Technology Stack

- **Framework**: Django 5.2 + Django REST Framework 3.16
- **Database**: SQLite3
- **Python**: 3.13+
- **Key Dependencies**:
  - `django-cors-headers` - CORS support for frontend
  - `django-filter` - Query filtering
  - `openbb` - Market data fetching via Yahoo Finance

## Project Structure

```
backend/
├── core/                       # Main Django application
│   ├── migrations/             # Database migrations
│   ├── services/               # Business logic services
│   │   ├── quote_provider.py   # Abstract provider interface
│   │   ├── openbb_provider.py  # Yahoo Finance via OpenBB
│   │   ├── justetf_provider.py # JustETF scraper
│   │   ├── currency_converter.py # Frankfurter.app API client
│   │   └── quote_fetcher.py    # Quote orchestration service
│   ├── tests/                  # Unit tests
│   ├── models.py               # Database models
│   ├── serializers.py          # DRF serializers
│   ├── views.py                # API endpoints
│   ├── table_calculations.py   # Portfolio calculation logic
│   └── admin.py                # Django admin configuration
├── portfoliodb/                # Django project settings
│   ├── settings.py             # Configuration
│   ├── urls.py                 # URL routing
│   ├── wsgi.py                 # WSGI entry point
│   └── asgi.py                 # ASGI entry point
├── manage.py                   # Django management script
├── pyproject.toml              # Python dependencies (uv)
└── db.sqlite3                  # SQLite database
```

## Data Model

### Core Tables

**Settings**
- `id` (PK)
- `base_currency` - Portfolio base currency (default: EUR)

**ActionType**
- `id` (PK)
- `name` - Transaction type (e.g., "Buy", "Sell")

**Investment**
- `id` (PK)
- `name` - Full investment name
- `isin` - International Securities Identification Number
- `shortname` - Display name
- `ticker_symbol` - Trading symbol
- `quote_provider` - Provider for price fetching (e.g., "openbb_yahoo", "justetf")

**InvestmentPrice**
- `date` - Price date
- `investment_id` (FK) - Reference to Investment
- `price` - Market price in base currency
- `source` - Data source identifier

**Movement**
- `id` (PK)
- `date` - Transaction date
- `action_id` (FK) - Reference to ActionType
- `investment_id` (FK) - Reference to Investment
- `quantity` - Number of shares/units
- `amount` - Total transaction amount
- `fee` - Transaction fees

## API Endpoints

### REST Resources

All endpoints are prefixed with `/api/`

**Investments** - `/api/investments/`
- `GET` - List all investments
- `POST` - Create new investment
- `GET /:id` - Get investment details
- `PUT /:id` - Update investment
- `DELETE /:id` - Delete investment

**Movements** - `/api/movements/`
- `GET` - List all transactions
- `POST` - Create new transaction
- `GET /:id` - Get transaction details
- `PUT /:id` - Update transaction
- `DELETE /:id` - Delete transaction

**Investment Prices** - `/api/investmentprices/`
- `GET` - List price data (default: last 3 years)
- Query params:
  - `investment` - Filter by investment ID
  - `start_date` - Start date (YYYY-MM-DD)
  - `end_date` - End date (YYYY-MM-DD)
- `POST` - Create price entry
- `GET /:id` - Get price details
- `PUT /:id` - Update price
- `DELETE /:id` - Delete price

**Action Types** - `/api/actiontypes/`
- `GET` - List transaction types
- `POST` - Create action type
- `GET /:id` - Get action type details
- `PUT /:id` - Update action type
- `DELETE /:id` - Delete action type

### Calculated Endpoints

**Portfolio Developments** - `/api/developments/`
- `GET` - Calculate portfolio value over time
- Query params:
  - `start_date` - Start date (YYYY-MM-DD, default: 3 years ago)
  - `end_date` - End date (YYYY-MM-DD, default: today)
- Returns: Array of `{investment, date, price, quantity, value}` objects

**Quote Management** - `/api/quotes/`
- `GET /api/quotes/providers/` - List available quote providers
- `POST /api/quotes/fetch/` - Trigger manual quote fetch
  - Body: `{"investment_ids": [1, 2, 3]}` or `{}` for all
  - Returns: `{total, successful, failed, results: [{investment_id, success, error}]}`

## Business Logic

### Portfolio Calculations (`table_calculations.py`)

The `developments()` function computes portfolio value over time:

1. **Data Sources**:
   - Transaction data from `Movement` table
   - Market prices from `InvestmentPrice` table

2. **Calculation Logic**:
   - For each investment and date combination:
     - Calculate cumulative quantity held (buys - sells)
     - Determine price (priority: market quote → transaction price → last known price)
     - Compute value = quantity × price

3. **Output**: Time series of portfolio positions with values

### Quote Fetching Service (`services/`)

**Architecture**:
```
QuoteFetcherService (Orchestrator)
    ├── QuoteProvider (Abstract Interface)
    │   ├── OpenBBYahooProvider (Yahoo Finance)
    │   └── JustETFProvider (JustETF scraper)
    └── CurrencyConverter (Frankfurter.app API)
```

**Workflow**:
1. Validate investment has `quote_provider` and `ticker_symbol`/`isin`
2. Fetch historical quotes from provider
3. Convert prices to base currency if needed
4. Store/update prices in database (upsert logic)

**Providers**:
- **OpenBB Yahoo**: Uses OpenBB Platform to fetch Yahoo Finance data
- **JustETF**: Web scraping for ETF data from justetf.com

**Currency Conversion**:
- Uses frankfurter.app free API
- Supports historical exchange rates
- Automatic conversion to portfolio base currency

## Development

### Setup

```bash
cd backend
uv sync  # Install dependencies
python manage.py migrate  # Run migrations
python manage.py createsuperuser  # Create admin user
```

### Running

```bash
# Development server
task start-backend
# or
python manage.py runserver

# Access at http://localhost:8000
# Admin at http://localhost:8000/admin
# API at http://localhost:8000/api
```

### Testing

```bash
task backend-test
# or
python manage.py test
```

### Database Management

```bash
# Create migrations after model changes
task makemigrations
# or
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Load sample data
task sample-data

# Load real data
task real-data
```

### Django Admin

Access at `http://localhost:8000/admin` to manage:
- Investments
- Movements (transactions)
- Investment Prices
- Action Types
- Settings

## Configuration

### Settings (`portfoliodb/settings.py`)

**Database**: SQLite at `backend/db.sqlite3`

**CORS**: Configured for development
- Allows all origins (development only)
- Specific origin: `http://localhost:3000`

**REST Framework**:
- Django Filter backend enabled for query filtering

**Logging**:
- Console output with verbose formatting
- DEBUG level for `core` app
- INFO level for Django

### Environment

No environment variables required for development. For production:
- Set `DEBUG = False`
- Configure `SECRET_KEY`
- Update `ALLOWED_HOSTS`
- Configure CORS origins properly

## Key Features

### ✅ Implemented

- **CRUD Operations**: Full REST API for all entities
- **Portfolio Calculations**: Time-series value computation
- **Quote Fetching**: Pluggable provider architecture
- **Currency Conversion**: Automatic conversion to base currency
- **Historical Data**: Support for date range queries
- **Admin Interface**: Django admin for data management
- **Filtering**: Query parameter filtering on endpoints
- **Testing**: Unit tests for core logic

### 🚧 Not Implemented

- **Background Jobs**: No scheduled quote fetching (cron mentioned in docs but not implemented)
- **PDF Parsing**: Transaction import from PDF documents
- **Authentication**: Single-user, no auth required
- **Rate Limiting**: No API rate limiting
- **Caching**: No response caching
- **Async Operations**: Synchronous quote fetching (could be slow for many investments)

## API Examples

### Fetch Quotes

```bash
# Fetch quotes for all configured investments
curl -X POST http://localhost:8000/api/quotes/fetch/ \
  -H "Content-Type: application/json" \
  -d '{}'

# Fetch quotes for specific investments
curl -X POST http://localhost:8000/api/quotes/fetch/ \
  -H "Content-Type: application/json" \
  -d '{"investment_ids": [1, 2, 3]}'
```

### Get Portfolio Developments

```bash
# Last 3 years (default)
curl http://localhost:8000/api/developments/

# Custom date range
curl "http://localhost:8000/api/developments/?start_date=2024-01-01&end_date=2024-12-31"
```

### Get Investment Prices

```bash
# All prices (last 3 years)
curl http://localhost:8000/api/investmentprices/

# Filter by investment
curl "http://localhost:8000/api/investmentprices/?investment=1"

# Custom date range
curl "http://localhost:8000/api/investmentprices/?start_date=2024-01-01&end_date=2024-12-31"
```

## Dependencies

See `pyproject.toml` for full dependency list. Key packages:

```toml
django = ">=5.2"
djangorestframework = ">=3.16.0"
django-cors-headers = ">=4.7.0"
django-filter = ">=25.2"
openbb = ">=4.1.3"
```

## Code Quality

- **Linting**: Ruff configured with flake8, isort, pylint rules
- **Line Length**: 120 characters
- **Testing**: Unit tests in `core/tests/`
- **Type Hints**: Partial type hints in service layer

## Performance Considerations

- **SQLite**: Adequate for single-user, consider PostgreSQL for multi-user
- **N+1 Queries**: Portfolio calculations use aggregations to minimize queries
- **Synchronous I/O**: Quote fetching is synchronous (blocking)
- **No Caching**: All data fetched from database on each request

## Future Improvements

1. **Background Jobs**: Add Celery for scheduled quote fetching
2. **Async Operations**: Use Django async views for quote fetching
3. **Caching**: Add Redis for frequently accessed data
4. **PDF Parsing**: Implement transaction import from broker PDFs
5. **API Documentation**: Add OpenAPI/Swagger documentation
6. **Rate Limiting**: Protect API endpoints
7. **Monitoring**: Add application monitoring and metrics
