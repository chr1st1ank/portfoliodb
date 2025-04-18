"""
URL configuration for portfoliodb project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from core import views as core_views

# REST API router
router = routers.DefaultRouter()
router.register(r"actiontypes", core_views.ActionTypeViewSet)
router.register(r"investments", core_views.InvestmentViewSet)
router.register(r"investmentprices", core_views.InvestmentPriceViewSet)
router.register(r"movements", core_views.MovementViewSet)
router.register(r"developments", core_views.DevelopmentViewSet, basename="developments")

urlpatterns = [
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/", include(router.urls)),
]
