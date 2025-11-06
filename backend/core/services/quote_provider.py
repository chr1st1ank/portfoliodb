"""
Abstract base class for quote providers.
"""

from abc import ABC, abstractmethod
from datetime import date
from decimal import Decimal
from typing import Optional


class QuoteData:
    """Data class for quote information."""

    def __init__(self, ticker: str, date: date, price: Decimal, currency: str, source: str):
        self.ticker = ticker
        self.date = date
        self.price = price
        self.currency = currency
        self.source = source


class QuoteProvider(ABC):
    """Abstract base class for quote providers."""

    @abstractmethod
    def get_quote(self, ticker: str, quote_date: Optional[date] = None) -> Optional[QuoteData]:
        """
        Fetch a single quote for the given ticker and date.

        Args:
            ticker: The ticker symbol to fetch
            quote_date: The date to fetch (defaults to latest/today)

        Returns:
            QuoteData object or None if not found
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the name of this provider.

        Returns:
            Provider name string (e.g., "openbb_yahoo")
        """
        pass
