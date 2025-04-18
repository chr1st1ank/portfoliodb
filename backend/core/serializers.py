from rest_framework import serializers
from .models import (
    ActionType,
    Investment,
    InvestmentPrice,
    Movement,
    PrecalculatedDevelopment,
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


class PrecalculatedDevelopmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrecalculatedDevelopment
        fields = "__all__"
