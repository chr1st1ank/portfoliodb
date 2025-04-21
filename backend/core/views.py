from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from rest_framework import viewsets
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
