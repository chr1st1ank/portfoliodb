from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.db.models import Avg, F, Sum
from django.db.models.functions import Abs

from .models import (
    Movement,
)


@dataclass
class Development:
    investment: int
    date: Any
    price: Decimal
    quantity: Decimal
    value: Decimal


def developments() -> list[dict]:
    transaction_days = (
        Movement.objects.values("investment", "date")
        .annotate(
            price=Avg(Abs(F("amount") / F("quantity"))),
        )
        .order_by("investment", "date")
    )
    movement_groups_buy = (
        Movement.objects.values("investment", "date")
        .filter(action=1)
        .order_by("investment", "date")
        .annotate(
            quantity=Sum("quantity"),
            amount=Sum("amount"),
            fee=Sum("fee"),
            price=Abs(F("amount") / F("quantity")),
        )
    )
    movement_groups_sell = (
        Movement.objects.values("investment", "date")
        .filter(action=2)
        .order_by("investment", "date")
        .annotate(
            quantity=Sum("quantity"),
            amount=Sum("amount"),
            fee=Sum("fee"),
            price=Abs(F("amount") / F("quantity")),
        )
    )

    developments = []
    for transaction_day in transaction_days:
        quantity_bought = (
            movement_groups_buy.filter(
                investment=transaction_day["investment"],
                date__lte=transaction_day["date"],
            ).aggregate(q=Sum("quantity"))["q"]
            or 0
        )
        quantity_sold = (
            movement_groups_sell.filter(
                investment=transaction_day["investment"],
                date__lte=transaction_day["date"],
            ).aggregate(q=Sum("quantity"))["q"]
            or 0
        )
        quantity = quantity_bought - quantity_sold
        developments.append(
            dict(
                investment=transaction_day["investment"],
                date=transaction_day["date"],
                price=transaction_day["price"],
                quantity=quantity,
                value=quantity * transaction_day["price"],
            )
        )
    return developments
