from rest_framework import serializers

from .models import (
    ActionType,
    Investment,
    InvestmentPrice,
    Movement,
)


class ActionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionType
        fields = "__all__"


class InvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = "__all__"


class InvestmentPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentPrice
        fields = "__all__"


class MovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movement
        fields = "__all__"


class DevelopmentSerializer(serializers.Serializer):
    investment = serializers.IntegerField()
    date = serializers.DateField()
    price = serializers.DecimalField(max_digits=14, decimal_places=8)
    quantity = serializers.DecimalField(max_digits=37, decimal_places=8)
    value = serializers.DecimalField(max_digits=51, decimal_places=16)
