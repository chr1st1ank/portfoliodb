"""
Main quote fetching service that orchestrates providers and currency conversion.
"""

import logging
from datetime import date
from typing import Dict, List, Optional

from django.db import transaction

from core.models import Investment, InvestmentPrice, Settings

from .currency_converter import CurrencyConverter
from .justetf_provider import JustETFProvider
from .openbb_provider import OpenBBYahooProvider
from .quote_provider import QuoteProvider

logger = logging.getLogger(__name__)


class QuoteFetchResult:
    """Result of a quote fetch operation."""

    def __init__(self, investment_id: int, success: bool, error: Optional[str] = None):
        self.investment_id = investment_id
        self.success = success
        self.error = error


class QuoteFetcherService:
    """Service for fetching and storing investment quotes."""

    def __init__(self):
        self.currency_converter = CurrencyConverter()
        self.providers: Dict[str, QuoteProvider] = {
            "openbb_yahoo": OpenBBYahooProvider(),
            "justetf": JustETFProvider(),
        }

    def get_available_providers(self) -> List[Dict[str, str]]:
        """
        Get list of available providers with their display names.
        
        Returns:
            List of dicts with 'id' and 'name' keys
        """
        return [
            {"id": provider_id, "name": provider_id}
            for provider_id in self.providers.keys()
        ]

    def _get_base_currency(self) -> str:
        """Get the base currency from settings."""
        try:
            settings = Settings.objects.first()
            if settings:
                return settings.base_currency
            return "EUR"  # Default fallback
        except Exception as e:
            logger.error(f"Error fetching base currency: {str(e)}")
            return "EUR"

    def _get_provider(self, provider_name: str) -> Optional[QuoteProvider]:
        """Get a provider instance by name."""
        return self.providers.get(provider_name)

    def fetch_quote_for_investment(self, investment: Investment, quote_date: Optional[date] = None) -> QuoteFetchResult:
        """
        Fetch and store a quote for a single investment.

        Args:
            investment: The Investment object to fetch quote for
            quote_date: The date to fetch (None for latest)

        Returns:
            QuoteFetchResult indicating success or failure
        """
        # Validate investment has required configuration
        if not investment.ticker_symbol:
            error = "No ticker symbol configured"
        elif not investment.quote_provider:
            error = "No quote provider configured"
        else:
            # Get provider
            provider = self._get_provider(investment.quote_provider)
            if not provider:
                error = f"Unknown provider: {investment.quote_provider}"
            else:
                error = None

        if error:
            return QuoteFetchResult(investment_id=investment.id, success=False, error=error)

        try:
            # Fetch quote from provider
            quote_data = provider.get_quote(investment.ticker_symbol, quote_date)
            if not quote_data:
                return QuoteFetchResult(
                    investment_id=investment.id, success=False, error="No quote data returned from provider"
                )

            # Get base currency
            base_currency = self._get_base_currency()

            # Convert to base currency if needed
            price_in_base_currency = quote_data.price
            if quote_data.currency != base_currency:
                converted_price = self.currency_converter.convert(
                    amount=quote_data.price,
                    from_currency=quote_data.currency,
                    to_currency=base_currency,
                    conversion_date=quote_data.date,
                )

                if converted_price is None:
                    return QuoteFetchResult(
                        investment_id=investment.id,
                        success=False,
                        error=f"Currency conversion failed: {quote_data.currency} to {base_currency}",
                    )

                price_in_base_currency = converted_price

            # Store in database (update if exists, create if not)
            with transaction.atomic():
                InvestmentPrice.objects.update_or_create(
                    investment=investment,
                    date=quote_data.date,
                    defaults={"price": price_in_base_currency, "source": quote_data.source},
                )

            logger.info(
                f"Successfully fetched quote for {investment.name} ({investment.ticker_symbol}): "
                f"{price_in_base_currency} {base_currency} on {quote_data.date}"
            )

            return QuoteFetchResult(investment_id=investment.id, success=True)

        except Exception as e:
            logger.error(f"Error fetching quote for investment {investment.id}: {str(e)}")
            return QuoteFetchResult(investment_id=investment.id, success=False, error=str(e))

    def fetch_quotes(
        self, investment_ids: Optional[List[int]] = None, quote_date: Optional[date] = None
    ) -> List[QuoteFetchResult]:
        """
        Fetch quotes for multiple investments.

        Args:
            investment_ids: List of investment IDs to fetch (None for all configured)
            quote_date: The date to fetch (None for latest)

        Returns:
            List of QuoteFetchResult objects
        """
        # Get investments to process
        if investment_ids:
            investments = Investment.objects.filter(id__in=investment_ids)
        else:
            # Only fetch for investments with ticker and provider configured
            investments = (
                Investment.objects.filter(ticker_symbol__isnull=False, quote_provider__isnull=False)
                .exclude(ticker_symbol="")
                .exclude(quote_provider="")
            )

        results = []
        for investment in investments:
            result = self.fetch_quote_for_investment(investment, quote_date)
            results.append(result)

        # Log summary
        success_count = sum(1 for r in results if r.success)
        logger.info(f"Quote fetch completed: {success_count}/{len(results)} successful")

        return results
