from dataclasses import dataclass
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
    queryset = InvestmentPrice.objects.all()
    serializer_class = InvestmentPriceSerializer


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
        developments = table_calculations.developments()
        serializer = DevelopmentSerializer(developments, many=True)
        return Response(serializer.data)


class QuoteViewSet(viewsets.ViewSet):
    """ViewSet for quote fetching operations."""

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
