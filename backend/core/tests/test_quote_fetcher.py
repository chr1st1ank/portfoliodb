"""
Tests for quote fetching service.
"""

from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase

from core.models import Investment, InvestmentPrice, Settings
from core.services.quote_fetcher import QuoteFetcherService
from core.services.quote_provider import QuoteData


class QuoteFetcherServiceTest(TestCase):
    """Test cases for QuoteFetcherService."""

    def setUp(self):
        """Set up test fixtures."""
        # Create Settings
        self.settings = Settings.objects.create(base_currency="EUR")

        # Create test investment
        self.investment = Investment.objects.create(
            name="Apple Inc.",
            isin="US0378331005",
            shortname="AAPL",
            ticker_symbol="AAPL",
            quote_provider="openbb_yahoo",
        )

        self.service = QuoteFetcherService()

    @patch("core.services.quote_fetcher.OpenBBYahooProvider")
    @patch("core.services.quote_fetcher.CurrencyConverter")
    def test_fetch_quote_success_no_conversion(self, mock_converter_class, mock_provider_class):
        """Test successful quote fetch without currency conversion."""
        # Mock provider
        mock_provider = MagicMock()
        mock_provider.get_quote.return_value = QuoteData(
            ticker="AAPL", date=date(2025, 11, 6), price=Decimal("150.25"), currency="EUR", source="openbb_yahoo"
        )
        mock_provider_class.return_value = mock_provider

        # Create service with mocked provider
        service = QuoteFetcherService()
        service.providers["openbb_yahoo"] = mock_provider

        # Fetch quote
        result = service.fetch_quote_for_investment(self.investment)

        # Verify result
        self.assertTrue(result.success)
        self.assertIsNone(result.error)
        self.assertEqual(result.investment_id, self.investment.id)

        # Verify price was stored
        price = InvestmentPrice.objects.get(investment=self.investment, date=date(2025, 11, 6))
        self.assertEqual(price.price, Decimal("150.25"))
        self.assertEqual(price.source, "openbb_yahoo")

    @patch("core.services.quote_fetcher.OpenBBYahooProvider")
    @patch("core.services.quote_fetcher.CurrencyConverter")
    def test_fetch_quote_success_with_conversion(self, mock_converter_class, mock_provider_class):
        """Test successful quote fetch with currency conversion."""
        # Mock provider
        mock_provider = MagicMock()
        mock_provider.get_quote.return_value = QuoteData(
            ticker="AAPL", date=date(2025, 11, 6), price=Decimal("150.00"), currency="USD", source="openbb_yahoo"
        )
        mock_provider_class.return_value = mock_provider

        # Mock currency converter
        mock_converter = MagicMock()
        mock_converter.convert.return_value = Decimal("140.00")  # USD to EUR
        mock_converter_class.return_value = mock_converter

        # Create service with mocked dependencies
        service = QuoteFetcherService()
        service.providers["openbb_yahoo"] = mock_provider
        service.currency_converter = mock_converter

        # Fetch quote
        result = service.fetch_quote_for_investment(self.investment)

        # Verify result
        self.assertTrue(result.success)
        self.assertIsNone(result.error)

        # Verify conversion was called
        mock_converter.convert.assert_called_once_with(
            amount=Decimal("150.00"), from_currency="USD", to_currency="EUR", conversion_date=date(2025, 11, 6)
        )

        # Verify converted price was stored
        price = InvestmentPrice.objects.get(investment=self.investment, date=date(2025, 11, 6))
        self.assertEqual(price.price, Decimal("140.00"))

    def test_fetch_quote_no_ticker(self):
        """Test fetch fails when no ticker symbol is configured."""
        investment = Investment.objects.create(
            name="Test Investment",
            isin="TEST123456",
            quote_provider="openbb_yahoo",
            # No ticker_symbol
        )

        result = self.service.fetch_quote_for_investment(investment)

        self.assertFalse(result.success)
        self.assertEqual(result.error, "No ticker symbol configured")

    def test_fetch_quote_no_provider(self):
        """Test fetch fails when no provider is configured."""
        investment = Investment.objects.create(
            name="Test Investment",
            isin="TEST123456",
            ticker_symbol="TEST",
            # No quote_provider
        )

        result = self.service.fetch_quote_for_investment(investment)

        self.assertFalse(result.success)
        self.assertEqual(result.error, "No quote provider configured")

    @patch("core.services.quote_fetcher.OpenBBYahooProvider")
    def test_fetch_quotes_multiple(self, mock_provider_class):
        """Test fetching quotes for multiple investments."""
        # Create additional investments
        investment2 = Investment.objects.create(
            name="Microsoft", isin="US5949181045", ticker_symbol="MSFT", quote_provider="openbb_yahoo"
        )

        # Mock provider
        mock_provider = MagicMock()
        mock_provider.get_quote.return_value = QuoteData(
            ticker="TEST", date=date(2025, 11, 6), price=Decimal("100.00"), currency="EUR", source="openbb_yahoo"
        )
        mock_provider_class.return_value = mock_provider

        # Create service with mocked provider
        service = QuoteFetcherService()
        service.providers["openbb_yahoo"] = mock_provider

        # Fetch quotes for specific investments
        results = service.fetch_quotes(investment_ids=[self.investment.id, investment2.id])

        # Verify results
        self.assertEqual(len(results), 2)
        self.assertTrue(all(r.success for r in results))
