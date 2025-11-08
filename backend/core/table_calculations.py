from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.db.models import Avg, F, Sum
from django.db.models.functions import Abs

from .models import (
    InvestmentPrice,
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
    """
    Calculate portfolio developments combining movement data and fetched quotes.
    
    For each investment and date, we calculate:
    - quantity: cumulative quantity held (from movements)
    - price: market price from InvestmentPrice if available, otherwise transaction price
    - value: quantity * price
    """
    # Get all transaction days with average transaction price
    transaction_days = (
        Movement.objects.values("investment", "date")
        .annotate(
            transaction_price=Avg(Abs(F("amount") / F("quantity"))),
        )
        .order_by("investment", "date")
    )
    
    # Get all days with fetched quotes
    quote_days = (
        InvestmentPrice.objects.values("investment", "date", "price")
        .order_by("investment", "date")
    )
    
    # Pre-calculate buy/sell aggregates for efficiency
    movement_groups_buy = (
        Movement.objects.values("investment", "date")
        .filter(action=1)
        .order_by("investment", "date")
        .annotate(
            quantity=Sum("quantity"),
        )
    )
    movement_groups_sell = (
        Movement.objects.values("investment", "date")
        .filter(action=2)
        .order_by("investment", "date")
        .annotate(
            quantity=Sum("quantity"),
        )
    )
    
    # Create a mapping of (investment, date) -> quote price
    quote_prices = {
        (q["investment"], q["date"]): q["price"]
        for q in quote_days
    }
    
    # Combine all unique (investment, date) pairs
    all_dates = set()
    for td in transaction_days:
        all_dates.add((td["investment"], td["date"]))
    for qd in quote_days:
        all_dates.add((qd["investment"], qd["date"]))
    
    # Sort by investment and date
    all_dates = sorted(all_dates, key=lambda x: (x[0], x[1]))
    
    # Build developments for all dates
    developments = []
    last_price_by_investment = {}  # Track last known price per investment
    
    for investment_id, date in all_dates:
        # Calculate quantity held on this date
        quantity_bought = (
            movement_groups_buy.filter(
                investment=investment_id,
                date__lte=date,
            ).aggregate(q=Sum("quantity"))["q"]
            or 0
        )
        quantity_sold = (
            movement_groups_sell.filter(
                investment=investment_id,
                date__lte=date,
            ).aggregate(q=Sum("quantity"))["q"]
            or 0
        )
        quantity = quantity_bought - quantity_sold
        
        # Determine price: prefer quote price, fallback to transaction price, then last known price
        price = None
        
        # 1. Try to get quote price for this date
        if (investment_id, date) in quote_prices:
            price = quote_prices[(investment_id, date)]
        
        # 2. If no quote, try to get transaction price for this date
        if price is None:
            transaction_on_date = next(
                (td for td in transaction_days if td["investment"] == investment_id and td["date"] == date),
                None
            )
            if transaction_on_date:
                price = transaction_on_date["transaction_price"]
        
        # 3. If still no price, use last known price for this investment
        if price is None:
            price = last_price_by_investment.get(investment_id)
        
        # Only add development if we have a price
        if price is not None:
            # Update last known price
            last_price_by_investment[investment_id] = price
            
            developments.append(
                dict(
                    investment=investment_id,
                    date=date,
                    price=price,
                    quantity=quantity,
                    value=quantity * price,
                )
            )
    
    return developments
