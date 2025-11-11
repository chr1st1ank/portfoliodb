"""
Main quote fetching service that orchestrates providers and currency conversion.
"""

import logging
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

    def fetch_quotes_for_investment(self, investment: Investment) -> QuoteFetchResult:
        """
        Fetch and store all available historical quotes for a single investment.

        Args:
            investment: The Investment object to fetch quotes for

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
            # Fetch all historical quotes from provider
            quotes_data = provider.get_quotes(investment.ticker_symbol or investment.isin)
            if not quotes_data:
                return QuoteFetchResult(
                    investment_id=investment.id, success=False, error="No quote data returned from provider"
                )

            # Get base currency
            base_currency = self._get_base_currency()

            # Process and store all quotes
            stored_count = 0
            with transaction.atomic():
                for quote_data in quotes_data:
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
                            logger.warning(
                                f"Currency conversion failed for {investment.ticker_symbol} "
                                f"on {quote_data.date}: {quote_data.currency} to {base_currency}"
                            )
                            continue

                        price_in_base_currency = converted_price

                    # Store in database (update if exists, create if not)
                    InvestmentPrice.objects.update_or_create(
                        investment=investment,
                        date=quote_data.date,
                        defaults={"price": price_in_base_currency, "source": quote_data.source},
                    )
                    stored_count += 1

            logger.info(
                f"Successfully fetched {stored_count} historical quotes for {investment.name} "
                f"({investment.ticker_symbol})"
            )

            return QuoteFetchResult(investment_id=investment.id, success=True)

        except Exception as e:
            logger.error(f"Error fetching historical quotes for investment {investment.id}: {str(e)}")
            return QuoteFetchResult(investment_id=investment.id, success=False, error=str(e))

    def fetch_quotes(self, investment_ids: Optional[List[int]] = None) -> List[QuoteFetchResult]:
        """
        Fetch all available historical quotes for multiple investments.

        Args:
            investment_ids: List of investment IDs to fetch (None for all configured)

        Returns:
            List of QuoteFetchResult objects
        """
        # Get investments to process
        if investment_ids:
            investments = Investment.objects.filter(id__in=investment_ids)
        else:
            # Only fetch for investments with ticker and provider configured
            investments = (
                Investment.objects.filter(quote_provider__isnull=False)
                .exclude(quote_provider="")
            )

        results = []
        for investment in investments:
            result = self.fetch_quotes_for_investment(investment)
            results.append(result)

        # Log summary
        success_count = sum(1 for r in results if r.success)
        logger.info(f"Quote fetch completed: {success_count}/{len(results)} successful")

        return results
