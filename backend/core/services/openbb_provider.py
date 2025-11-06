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
                    return QuoteData(
                        ticker=ticker,
                        date=latest.date.date() if hasattr(latest.date, "date") else latest.date,
                        price=Decimal(str(latest.close)),
                        currency=getattr(latest, "currency", "USD"),  # Default to USD if not available
                        source=self.provider_name,
                    )
            else:
                # Fetch specific date (with a small range to handle weekends/holidays)
                result = obb.equity.price.historical(
                    symbol=ticker, provider="yfinance", start_date=quote_date, end_date=quote_date, interval="1d"
                )

                if result and hasattr(result, "results") and result.results:
                    data = result.results[0]
                    return QuoteData(
                        ticker=ticker,
                        date=data.date.date() if hasattr(data.date, "date") else data.date,
                        price=Decimal(str(data.close)),
                        currency=getattr(data, "currency", "USD"),
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
