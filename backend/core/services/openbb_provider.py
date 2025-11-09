"""
OpenBB provider implementation for fetching quotes.
"""

import logging
from datetime import date
from decimal import Decimal
from typing import Optional

from openbb import obb

from .quote_provider import QuoteData, QuoteProvider

logger = logging.getLogger(__name__)


class OpenBBYahooProvider(QuoteProvider):
    """OpenBB provider using Yahoo Finance as data source."""

    def __init__(self):
        self.provider_name = "openbb_yahoo"
        self._currency_cache = {}  # Cache currency lookups to avoid repeated API calls

    def _get_ticker_currency(self, ticker: str) -> str:
        """
        Get the currency for a ticker by fetching its profile/info.

        Args:
            ticker: The ticker symbol

        Returns:
            Currency code (e.g., "GBP", "USD", "EUR")
        """
        # Check cache first
        if ticker in self._currency_cache:
            return self._currency_cache[ticker]

        try:
            # Try to get equity profile which includes currency
            profile = obb.equity.profile(symbol=ticker, provider="yfinance")

            if profile and hasattr(profile, "results") and profile.results:
                currency = getattr(profile.results[0], "currency", None)
                if currency:
                    self._currency_cache[ticker] = currency
                    logger.info(f"Detected currency for {ticker}: {currency}")
                    return currency

            logger.warning(f"Could not detect currency for {ticker}, defaulting to USD")
            return "USD"

        except Exception as e:
            logger.warning(f"Error fetching currency for {ticker}: {str(e)}, defaulting to USD")
            return "USD"

    def get_quote(self, ticker: str, quote_date: Optional[date] = None) -> Optional[QuoteData]:
        """
        Fetch a single quote using OpenBB's Yahoo Finance provider.

        Args:
            ticker: The ticker symbol to fetch
            quote_date: The date to fetch (if None, fetches latest)

        Returns:
            QuoteData object or None if not found
        """
        try:
            # If no date specified, fetch latest quote
            if quote_date is None:
                # Fetch recent data (last 5 days to ensure we get the latest)
                result = obb.equity.price.historical(symbol=ticker, provider="yfinance", interval="1d")

                if result and hasattr(result, "results") and result.results:
                    # Get the most recent entry
                    latest = result.results[-1]
                    # Get currency from ticker profile/info
                    currency = self._get_ticker_currency(ticker)
                    return QuoteData(
                        ticker=ticker,
                        date=latest.date.date() if hasattr(latest.date, "date") else latest.date,
                        price=Decimal(str(latest.close)),
                        currency=currency,
                        source=self.provider_name,
                    )
            else:
                # Fetch specific date (with a small range to handle weekends/holidays)
                result = obb.equity.price.historical(
                    symbol=ticker, provider="yfinance", start_date=quote_date, end_date=quote_date, interval="1d"
                )

                if result and hasattr(result, "results") and result.results:
                    data = result.results[0]
                    # Get currency from ticker profile/info
                    currency = self._get_ticker_currency(ticker)
                    return QuoteData(
                        ticker=ticker,
                        date=data.date.date() if hasattr(data.date, "date") else data.date,
                        price=Decimal(str(data.close)),
                        currency=currency,
                        source=self.provider_name,
                    )

            logger.warning(f"No quote data found for ticker {ticker} on date {quote_date}")
            return None

        except Exception as e:
            logger.error(f"Error fetching quote for {ticker}: {str(e)}")
            return None

    def get_provider_name(self) -> str:
        """Get the name of this provider."""
        return self.provider_name
