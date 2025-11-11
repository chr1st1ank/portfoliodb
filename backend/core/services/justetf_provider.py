"""JustETF provider implementation for fetching ETF quotes."""

import logging
from datetime import date
from decimal import Decimal
from typing import Optional

import requests

from .quote_provider import QuoteData, QuoteProvider

logger = logging.getLogger(__name__)


class JustETFProvider(QuoteProvider):
    """JustETF provider for fetching ETF quotes."""

    BASE_URL = "https://www.justetf.com/api/etfs/{isin}/performance-chart"
    DEFAULT_PARAMS = {
        "locale": "en",
        "currency": "EUR",
        "valuesType": "MARKET_VALUE",
        "reduceData": "false",
        "includeDividends": "false",
        "features": "DIVIDENDS",
    }

    def __init__(self, currency: str = "EUR"):
        """Initialize JustETF provider.

        Args:
            currency: Currency for quotes (default: EUR)
        """
        self.provider_name = "justetf"
        self.currency = currency
        self._cache = {}  # Cache API responses by ISIN

    def _fetch_data(self, isin: str) -> Optional[dict]:
        """Fetch data from JustETF API.

        Args:
            isin: The ISIN of the ETF

        Returns:
            API response as dict or None if error
        """
        # Check cache first
        if isin in self._cache:
            return self._cache[isin]

        try:
            url = self.BASE_URL.format(isin=isin)
            params = self.DEFAULT_PARAMS.copy()
            params["currency"] = self.currency

            # Add headers to avoid 403 errors
            headers = {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": f"https://www.justetf.com/en/etf-profile.html?isin={isin}",
            }

            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()
            self._cache[isin] = data
            return data

        except requests.RequestException as e:
            logger.error(f"Error fetching data from JustETF for {isin}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching JustETF data for {isin}: {str(e)}")
            return None

    def get_quote(self, ticker: str, quote_date: Optional[date] = None) -> Optional[QuoteData]:
        """Fetch a single quote for the given ISIN and date.

        Args:
            ticker: The ISIN of the ETF
            quote_date: The date to fetch (defaults to latest)

        Returns:
            QuoteData object or None if not found
        """
        data = self._fetch_data(ticker)
        if not data:
            return None

        try:
            # If no specific date requested, return latest quote
            if quote_date is None:
                latest_quote = data.get("latestQuote", {}).get("raw")
                latest_date_str = data.get("latestQuoteDate")

                if latest_quote is None or latest_date_str is None:
                    logger.warning(f"No latest quote found for {ticker}")
                    return None

                return QuoteData(
                    ticker=ticker,
                    date=date.fromisoformat(latest_date_str),
                    price=Decimal(str(latest_quote)),
                    currency=self.currency,
                    source=self.provider_name,
                )

            # Search for specific date in series
            series = data.get("series", [])
            target_date_str = quote_date.isoformat()

            for entry in series:
                if entry.get("date") == target_date_str:
                    value = entry.get("value", {}).get("raw")
                    if value is not None:
                        return QuoteData(
                            ticker=ticker,
                            date=quote_date,
                            price=Decimal(str(value)),
                            currency=self.currency,
                            source=self.provider_name,
                        )

            logger.warning(f"No quote found for {ticker} on date {quote_date}")
            return None

        except Exception as e:
            logger.error(f"Error parsing JustETF data for {ticker}: {str(e)}")
            return None

    def get_quotes(self, ticker_symbol: str) -> list[QuoteData]:
        """Fetch all available historical quotes for the given ISIN.

        Args:
            ticker_symbol: The ISIN of the ETF

        Returns:
            List of QuoteData objects
        """
        data = self._fetch_data(ticker_symbol)
        if not data:
            return []

        quotes = []
        try:
            series = data.get("series", [])

            for entry in series:
                date_str = entry.get("date")
                value = entry.get("value", {}).get("raw")

                if date_str and value is not None:
                    quotes.append(
                        QuoteData(
                            ticker=ticker_symbol,
                            date=date.fromisoformat(date_str),
                            price=Decimal(str(value)),
                            currency=self.currency,
                            source=self.provider_name,
                        )
                    )

            logger.info(f"Fetched {len(quotes)} quotes for {ticker_symbol} from JustETF")
            return quotes

        except Exception as e:
            logger.error(f"Error parsing JustETF series data for {ticker_symbol}: {str(e)}")
            return []

    def get_provider_name(self) -> str:
        """Get the name of this provider.

        Returns:
            Provider name string
        """
        return self.provider_name
