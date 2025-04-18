from rest_framework import viewsets
from .models import (
    ActionType,
    Investment,
    InvestmentPrice,
    Movement,
    PrecalculatedDevelopment,
)
from .serializers import (
    ActionTypeSerializer,
    InvestmentSerializer,
    InvestmentPriceSerializer,
    MovementSerializer,
    PrecalculatedDevelopmentSerializer,
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


class PrecalculatedDevelopmentViewSet(viewsets.ModelViewSet):
    queryset = PrecalculatedDevelopment.objects.all()
    serializer_class = PrecalculatedDevelopmentSerializer
