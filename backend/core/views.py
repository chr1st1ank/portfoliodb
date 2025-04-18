from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal
from .models import (
    ActionType,
    Investment,
    InvestmentPrice,
    Movement,
)
from .serializers import (
    ActionTypeSerializer,
    InvestmentSerializer,
    InvestmentPriceSerializer,
    MovementSerializer,
    DevelopmentSerializer,
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


class DevelopmentViewSet(viewsets.ViewSet):
    def list(self, request):
        # Get all unique dates from movements
        dates = (
            Movement.objects.values_list("date", flat=True).distinct().order_by("date")
        )

        developments = []

        for date in dates:
            # Get all movements up to this date
            movements = Movement.objects.filter(date__lte=date)

            # Group by investment and calculate quantities
            investment_quantities = movements.values("investment").annotate(
                total_quantity=Coalesce(
                    Sum(
                        "quantity",
                        output_field=DecimalField(max_digits=37, decimal_places=8),
                    ),
                    Decimal("0"),
                )
            )

            # For each investment, get the latest price and calculate value
            for investment_data in investment_quantities:
                investment_id = investment_data["investment"]
                quantity = investment_data["total_quantity"]

                # Get the latest price for this investment up to this date
                latest_price = (
                    InvestmentPrice.objects.filter(
                        investment=investment_id, date__lte=date
                    )
                    .order_by("-date")
                    .first()
                )

                if latest_price:
                    price = latest_price.price
                    value = price * quantity

                    developments.append(
                        {
                            "investment": investment_id,
                            "date": date,
                            "price": price,
                            "quantity": quantity,
                            "value": value,
                        }
                    )

        serializer = DevelopmentSerializer(developments, many=True)
        return Response(serializer.data)
