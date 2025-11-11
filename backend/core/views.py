from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from . import table_calculations
from .models import (
    ActionType,
    Investment,
    InvestmentPrice,
    Movement,
)
from .serializers import (
    ActionTypeSerializer,
    DevelopmentSerializer,
    InvestmentPriceSerializer,
    InvestmentSerializer,
    MovementSerializer,
)
from .services.quote_fetcher import QuoteFetcherService


class ActionTypeViewSet(viewsets.ModelViewSet):
    queryset = ActionType.objects.all()
    serializer_class = ActionTypeSerializer


class InvestmentViewSet(viewsets.ModelViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer


class InvestmentPriceViewSet(viewsets.ModelViewSet):
    queryset = InvestmentPrice.objects.all()  # Required for router registration
    serializer_class = InvestmentPriceSerializer
    filterset_fields = ['investment']

    def get_queryset(self):
        """
        Filter investment prices by date range.
        Default: last 3 years of data.
        Query params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
        """
        queryset = InvestmentPrice.objects.all()
        
        # Get date parameters
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        # If no dates specified, default to last 3 years
        if not start_date and not end_date:
            default_start = datetime.now().date() - timedelta(days=3*365)
            queryset = queryset.filter(date__gte=default_start)
        else:
            if start_date:
                queryset = queryset.filter(date__gte=start_date)
            if end_date:
                queryset = queryset.filter(date__lte=end_date)
        
        return queryset.order_by('-date')


class MovementViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.all()
    serializer_class = MovementSerializer


@dataclass
class Development:
    investment: int
    date: Any
    price: Decimal
    quantity: Decimal
    value: Decimal


class DevelopmentViewSet(viewsets.ViewSet):
    def list(self, request):
        """
        Get portfolio developments.
        Query params: start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
        Default: last 3 years of data.
        """
        # Get date parameters
        start_date_str = request.query_params.get('start_date', None)
        end_date_str = request.query_params.get('end_date', None)
        
        # Parse dates or use defaults
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = datetime.now().date() - timedelta(days=3*365)
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = None
        
        # Get all developments and filter by date
        developments = table_calculations.developments()
        
        # Filter developments by date range (developments are dicts with 'date' key)
        filtered_developments = []
        for d in developments:
            dev_date = d['date'] if isinstance(d['date'], date) else datetime.strptime(d['date'], '%Y-%m-%d').date()
            if dev_date >= start_date and (end_date is None or dev_date <= end_date):
                filtered_developments.append(d)
        
        serializer = DevelopmentSerializer(filtered_developments, many=True)
        return Response(serializer.data)


class QuoteViewSet(viewsets.ViewSet):
    """ViewSet for quote fetching operations."""

    @action(detail=False, methods=["get"])
    def providers(self, request):
        """
        Get list of available quote providers.

        GET /api/quotes/providers/
        Returns: [{"id": "openbb_yahoo", "name": "Yahoo Finance"}, ...]
        """
        service = QuoteFetcherService()
        providers = service.get_available_providers()
        
        return Response(providers, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def fetch(self, request):
        """
        Trigger manual quote fetch.

        POST /api/quotes/fetch/
        Body: {"investment_ids": [1, 2, 3]} or {} for all
        """
        investment_ids = request.data.get("investment_ids", None)

        # Initialize service and fetch quotes
        service = QuoteFetcherService()
        results = service.fetch_quotes(investment_ids=investment_ids)

        # Format response
        response_data = {
            "total": len(results),
            "successful": sum(1 for r in results if r.success),
            "failed": sum(1 for r in results if not r.success),
            "results": [{"investment_id": r.investment_id, "success": r.success, "error": r.error} for r in results],
        }

        return Response(response_data, status=status.HTTP_200_OK)
