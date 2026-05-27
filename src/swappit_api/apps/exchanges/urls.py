"""apps/exchanges/urls.py"""
from django.urls import path
from .views import ExchangeListCreateView, ExchangeRespondView

urlpatterns = [
    path('',                 ExchangeListCreateView.as_view(), name='exchange-list-create'),
    path('<int:pk>/respond/', ExchangeRespondView.as_view(),   name='exchange-respond'),
]
