# Quote Fetching Services

This directory contains the service layer for fetching and storing investment quotes.

## Architecture

The quote fetching system is designed with a clean separation of concerns:

```
QuoteFetcherService (Orchestrator)
    ├── QuoteProvider (Abstract Interface)
    │   └── OpenBBYahooProvider (Implementation)
    └── CurrencyConverter (Utility)
```

## Components

### `quote_provider.py`
Abstract base class defining the provider interface.

- **QuoteProvider**: Abstract base class that all providers must implement
- **QuoteData**: Data class for standardized quote information

### `openbb_provider.py`
OpenBB implementation using Yahoo Finance.

- **OpenBBYahooProvider**: Fetches quotes from Yahoo Finance via OpenBB Platform
- Provider name: `"openbb_yahoo"`
- Supports both latest and historical date queries

### `currency_converter.py`
Currency conversion service.

- **CurrencyConverter**: Converts amounts between currencies using frankfurter.app API
- Supports historical exchange rates
- Free service, no API key required

### `quote_fetcher.py`
Main orchestration service.

- **QuoteFetcherService**: Coordinates the entire quote fetching process
- **QuoteFetchResult**: Result object for fetch operations
- Workflow:
  1. Validate investment configuration
  2. Fetch quote from provider
  3. Convert to base currency if needed
  4. Store in database

## Usage Example

```python
from core.services.quote_fetcher import QuoteFetcherService

# Initialize service
service = QuoteFetcherService()

# Fetch quotes for all configured investments
results = service.fetch_quotes()

# Fetch quotes for specific investments
results = service.fetch_quotes(investment_ids=[1, 2, 3])

# Fetch quote for a single investment
from core.models import Investment
investment = Investment.objects.get(id=1)
result = service.fetch_quote_for_investment(investment)
```

## Adding New Providers

To add a new quote provider:

1. Create a new class that inherits from `QuoteProvider`
2. Implement the `get_quote()` method
3. Implement the `get_provider_name()` method
4. Register the provider in `QuoteFetcherService.__init__()`

Example:

```python
from .quote_provider import QuoteProvider, QuoteData

class MyCustomProvider(QuoteProvider):
    def get_quote(self, ticker: str, quote_date: Optional[date] = None) -> Optional[QuoteData]:
        # Fetch quote from your data source
        # Return QuoteData object
        pass
    
    def get_provider_name(self) -> str:
        return "my_custom_provider"
```

Then register it in `QuoteFetcherService`:

```python
def __init__(self):
    self.currency_converter = CurrencyConverter()
    self.providers: Dict[str, QuoteProvider] = {
        "openbb_yahoo": OpenBBYahooProvider(),
        "my_custom_provider": MyCustomProvider(),
    }
```

## Error Handling

All services implement graceful error handling:
- Return `None` or `QuoteFetchResult` with error message on failure
- Log errors for debugging
- Continue processing other investments if one fails

## Testing

Tests are located in `backend/core/tests/test_quote_fetcher.py`.

Run tests with:
```bash
task backend-test
```
