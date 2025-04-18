from django.contrib import admin
from .models import (
    ActionType,
    Investment,
    InvestmentPrice,
    Movement,
)

admin.site.register(ActionType)
admin.site.register(Investment)
admin.site.register(InvestmentPrice)
admin.site.register(Movement)
