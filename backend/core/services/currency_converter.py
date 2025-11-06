"""
Currency conversion service using frankfurter.app API (free, no API key required).
"""

import logging
from datetime import date
from decimal import Decimal
from typing import Optional

import requests

logger = logging.getLogger(__name__)


class CurrencyConverter:
    """Currency converter using frankfurter.app API."""

    BASE_URL = "https://api.frankfurter.app"

    def convert(
        self, amount: Decimal, from_currency: str, to_currency: str, conversion_date: Optional[date] = None
    ) -> Optional[Decimal]:
        """
        Convert an amount from one currency to another.

        Args:
            amount: The amount to convert
            from_currency: Source currency code (e.g., "USD")
            to_currency: Target currency code (e.g., "EUR")
            conversion_date: Date for historical conversion (None for latest)

        Returns:
            Converted amount as Decimal or None if conversion fails
        """
        # If currencies are the same, no conversion needed
        if from_currency == to_currency:
            return amount

        try:
            # Build URL based on whether we need historical or latest rate
            if conversion_date:
                url = f"{self.BASE_URL}/{conversion_date.isoformat()}"
            else:
                url = f"{self.BASE_URL}/latest"

            # Make request
            params = {"amount": float(amount), "from": from_currency, "to": to_currency}

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            # Extract converted amount
            if "rates" in data and to_currency in data["rates"]:
                converted = data["rates"][to_currency]
                return Decimal(str(converted))

            logger.error(f"Conversion rate not found in response: {data}")
            return None

        except requests.RequestException as e:
            logger.error(f"Error converting {from_currency} to {to_currency}: {str(e)}")
            return None
        except (KeyError, ValueError) as e:
            logger.error(f"Error parsing conversion response: {str(e)}")
            return None

    def get_exchange_rate(
        self, from_currency: str, to_currency: str, conversion_date: Optional[date] = None
    ) -> Optional[Decimal]:
        """
        Get the exchange rate between two currencies.

        Args:
            from_currency: Source currency code
            to_currency: Target currency code
            conversion_date: Date for historical rate (None for latest)

        Returns:
            Exchange rate as Decimal or None if not available
        """
        return self.convert(Decimal("1"), from_currency, to_currency, conversion_date)
