from datetime import date
from decimal import Decimal as Dec

from django.test import TestCase

from core.models import (
    ActionType,
    Investment,
    Movement,
)
from core.table_calculations import developments


class TestDevelopmentOnlyBuy(TestCase):
    def setUp(self):
        buy = ActionType.objects.get(name="Buy")
        inv = Investment.objects.create(id=1, name="investment1", shortname="inv1", isin="INV0001")
        Movement.objects.create(date="2025-04-02", action=buy, investment=inv, quantity=5, amount=-50, fee=0)

    def test_only_buy(self):
        d = developments()
        self.assertEqual(
            [
                {
                    "investment": 1,
                    "date": date(2025, 4, 2),
                    "price": Dec(10),
                    "quantity": Dec(5),
                    "value": Dec(50),
                }
            ],
            d,
        )


class TestDevelopmentSellSameDay(TestCase):
    def setUp(self):
        buy, sell, *_ = ActionType.objects.all().order_by("id")
        inv1 = Investment.objects.create(id=1, name="investment1", shortname="inv1", isin="INV0001")
        Movement.objects.create(date="2025-04-01", action=buy, investment=inv1, quantity=10, amount=-100, fee=0)
        Movement.objects.create(date="2025-04-01", action=sell, investment=inv1, quantity=10, amount=100, fee=0)

    def test_developments(self):
        d = developments()
        self.assertEqual(
            [
                {
                    "investment": 1,
                    "date": date(2025, 4, 1),
                    "price": Dec(10),
                    "quantity": Dec(0),
                    "value": Dec(0),
                }
            ],
            d,
        )


class TestDevelopmentBuyTwice(TestCase):
    def setUp(self):
        buy = ActionType.objects.get(name="Buy")
        inv = Investment.objects.create(id=1, name="investment1", shortname="inv1", isin="INV0001")
        Movement.objects.create(date="2025-04-03", action=buy, investment=inv, quantity=2, amount=-20, fee=0)
        Movement.objects.create(date="2025-04-03", action=buy, investment=inv, quantity=3, amount=-30, fee=0)

    def test_multiple_movements_same_day(self):
        d = developments()
        self.assertEqual(
            [
                {
                    "investment": 1,
                    "date": date(2025, 4, 3),
                    "price": Dec(10),
                    "quantity": Dec(5),
                    "value": Dec(50),
                }
            ],
            d,
        )


class TestDevelopmentLongerTime(TestCase):
    def setUp(self):
        buy, sell, *_ = ActionType.objects.all().order_by("id")
        inv = Investment.objects.create(id=1, name="investment1", shortname="inv1", isin="INV0001")
        Movement.objects.create(date="2025-04-03", action=buy, investment=inv, quantity=2, amount=-20, fee=0)
        Movement.objects.create(date="2025-04-03", action=buy, investment=inv, quantity=3, amount=-30, fee=0)

        Movement.objects.create(date="2027-02-01", action=sell, investment=inv, quantity=4, amount=80, fee=0)

        Movement.objects.create(date="2027-05-01", action=buy, investment=inv, quantity=2, amount=-10, fee=0)

        Movement.objects.create(date="2028-04-03", action=sell, investment=inv, quantity=3, amount=45, fee=0)

    def test_multiple_movements_same_day(self):
        self.maxDiff = 1000
        d = developments()
        self.assertEqual(
            [
                {
                    "investment": 1,
                    "date": date(2025, 4, 3),
                    "price": Dec(10),
                    "quantity": Dec(5),
                    "value": Dec(50),
                },
                {
                    "investment": 1,
                    "date": date(2027, 2, 1),
                    "price": Dec(20),
                    "quantity": Dec(1),
                    "value": Dec(20),
                },
                {
                    "investment": 1,
                    "date": date(2027, 5, 1),
                    "price": Dec(5),
                    "quantity": Dec(3),
                    "value": Dec(15),
                },
                {
                    "investment": 1,
                    "date": date(2028, 4, 3),
                    "price": Dec(15),
                    "quantity": Dec(0),
                    "value": Dec(0),
                },
            ],
            d,
        )
