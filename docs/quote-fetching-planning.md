# Quote Fetching Feature - Planning Document

**Status:** Planning Phase  
**Last Updated:** 2025-11-06

## Overview

Feature to automatically fetch daily stock/fund quotes from online sources and store them in the database.

## Goals

- Fetch daily end-of-day prices for investments (stocks and funds)
- Use free, public data sources via OpenBB Platform
- Store historical price data in base currency for portfolio valuation
- Enable continuous portfolio tracking (including non-transaction days)
- Support automated daily updates and manual triggers

## Requirements

### Functional Requirements

1. **Price Fetching & Storage**
   - Fetch end-of-day prices via provider-specific ticker symbols
   - Convert to base currency before storage
   - Override same-day prices; fetch only missing historical dates
   - Store in `InvestmentPrice` with source tracking

2. **Configuration**
   - Per-investment ticker symbol and provider configuration
   - Global base currency setting (Settings model)
   - Manual configuration via UI

3. **Automation & Manual Operations**
   - Daily scheduled execution
   - Manual trigger via UI for all or specific investments
   - Backfill historical prices
   - Error handling, retry logic, and logging

4. **User Interface**
   - Investment configuration (ticker/provider per investment)
   - Quotes page: list investments with latest prices, fetch status
   - Price history view
   - Manual fetch trigger button

5. **Portfolio Integration**
   - Use fetched quotes for daily portfolio valuation
   - Fill gaps between transactions for continuous development tracking

### Non-Functional Requirements

- **Reliability:** Graceful handling of API failures or missing data
- **Performance:** Batch fetching to minimize API calls
- **Maintainability:** Clear separation of concerns, easy to add new data sources
- **Observability:** Logging of operations and errors

## Architecture

```
        API Endpoint / Management Command
                      |
              Quote Fetching Service
              (orchestration, logging)
                      |
         ┌────────────┴────────────┐
         │                         │
   Provider Layer          Currency Conversion
  (OpenBB, custom)              Service
         │                         │
         └────────────┬────────────┘
                      │
              InvestmentPrice Model
            (all prices in base currency)
```

## Implementation Approach

### Phase 1: Backend API & Core Infrastructure ✅ COMPLETED

**Existing Infrastructure (Already Available):**
- ✅ `GET /api/investments/` - List investments
- ✅ `PATCH /api/investments/{id}/` - Update investment (will work with new ticker/provider fields)
- ✅ `GET /api/investmentprices/` - List prices (can filter by investment, date)
- ✅ `POST /api/investmentprices/` - Create new price entries

**New Work Completed:**
1. ✅ Create database migrations:
   - ✅ Add `Settings` model with `base_currency` field
   - ✅ Add `ticker_symbol`, `quote_provider` fields to `Investment` model
   - ✅ Create initial Settings row with default base currency
2. ✅ Add dependencies to backend:
   - ✅ `uv add openbb` - Quote data provider
   - ✅ Currency conversion using frankfurter.app API (free, no API key required)
3. ✅ Create provider abstraction layer (interface/base class)
4. ✅ Implement OpenBB provider(s) - Yahoo Finance integration first
5. ✅ Create currency conversion service
6. ✅ Create quote fetching service with core logic:
   - ✅ Fetch quote in original currency
   - ✅ Convert to base currency
   - ✅ Store in InvestmentPrice
7. ✅ Add new API endpoint for triggering fetches:
   - ✅ `POST /api/quotes/fetch/` - Trigger manual fetch (body: `{"investment_ids": [1,2,3]}` or empty for all)
8. ⏭️ (Optional) Add fetch status endpoint:
   - `GET /api/quotes/status/` - Get current fetch operation status (deferred to Phase 6)

### Phase 2: Frontend UI (Priority for Testing)
1. Edit investment configuration UI:
   - Add option to edit the ticker symbol per investment
   - Select provider from dropdown (e.g., "OpenBB Yahoo", "OpenBB EODHD", "Not configured")
   - Use the existing dialog
2. Create Quotes page/view in frontend
3. Display investments list with latest prices:
   - Investment name, ISIN, ticker symbol
   - Provider used
   - Latest price and date
   - Last update timestamp
   - Configuration status indicator
4. Add manual fetch trigger button
5. Show fetch status/progress indicators
6. Add price history view/modal for individual investments
7. Display error messages for failed fetches or missing configuration

### Phase 3: Management Command
1. Create Django management command
2. Support for fetching all investments
3. Support for specific investments (by ID or ISIN)
4. Support for date range specification

### Phase 4: Automation
1. Set up scheduled task execution (cron or Django-Q/Celery)
2. Configure daily execution
3. Add monitoring/alerting for failures

### Phase 5: Integration with Portfolio Features
1. Update portfolio valuation logic to use `InvestmentPrice` data
2. Modify portfolio development/performance calculations:
   - Calculate daily portfolio values using fetched quotes
   - Fill gaps between transactions with quote-based valuations
   - Maintain backward compatibility with existing Movement-only logic
3. Update relevant frontend components to display continuous portfolio development

### Phase 6: Enhancement
1. Backfill capability for historical data
2. Performance optimizations (parallel fetching, caching)
3. Additional data providers if needed
4. Real-time fetch status updates (WebSocket/SSE)

## Key Technical Decisions

1. **Data Source:** OpenBB Platform (supports Yahoo Finance, EODHD, etc.)
2. **Provider Configuration:** Per-investment ticker + provider stored in database (no automatic ISIN conversion)
3. **Currency:** Convert all prices to base currency (Settings.base_currency) before storage
4. **Data Model:** Prices always in base currency, no currency field needed in InvestmentPrice

## Open Questions

1. **Currency Conversion Service:** OpenBB (if available), or frankfurter.app / ECB API as free alternatives
2. **Scheduling:** System cron (simple) or Django-Q/Celery (more features)
3. **Error Handling:** Log errors, continue with other investments, display in UI
4. **Rate Limiting:** Batch processing with configurable delays between requests
5. **Scheduling Time:** After major market close (e.g., 23:00 CET)

## Data Model Changes

### New Settings Model

Create new `Settings` model for application configuration:
```python
class Settings(models.Model):
    id = models.AutoField(primary_key=True, db_column="ID")
    base_currency = models.CharField(max_length=3, db_column="BaseCurrency", default="EUR")
    # Future settings can be added here
    
    class Meta:
        db_table = "Settings"
```

- Single-row table for global configuration
- `base_currency`: ISO 4217 3-char code (default: "EUR")

### Investment Model Updates

Add to existing model:
```python
class Investment(models.Model):
    id = models.AutoField(primary_key=True, db_column="ID")
    name = models.TextField(null=True, db_column="Name")
    isin = models.CharField(max_length=20, null=True, db_column="ISIN")
    shortname = models.CharField(max_length=30, null=True, db_column="ShortName")
    # NEW FIELDS:
    ticker_symbol = models.CharField(max_length=20, null=True, db_column="TickerSymbol")
    quote_provider = models.CharField(max_length=20, null=True, db_column="QuoteProvider")
```

- Both fields nullable (not all investments need quotes)
- Configured manually via UI

### InvestmentPrice Model (No Changes)

Existing model already sufficient:
```python
class InvestmentPrice(models.Model):
    date = models.DateField(null=True, db_column="Date")
    investment = models.ForeignKey(Investment, ...)
    price = models.DecimalField(max_digits=10, decimal_places=4, null=True, db_column="Price")
    source = models.CharField(max_length=20, null=True, db_column="Source")
```

- `source` matches Investment.quote_provider
- All prices in base currency (no currency field needed)
- Optional future additions: `fetched_at` timestamp, unique constraint on (investment, date)

## Notes

- Architecture designed for multiple providers (future: bank website scraper)
- OpenBB Platform chosen for better architecture than yfinance
- Start with Yahoo Finance provider, add others as needed
