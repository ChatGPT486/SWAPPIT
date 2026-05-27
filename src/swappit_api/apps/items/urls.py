"""apps/items/urls.py"""
from django.urls import path
from .views import ItemListCreateView, ItemDetailView, MyItemsView, SuggestionsView

urlpatterns = [
    path('',             ItemListCreateView.as_view(), name='item-list-create'),
    path('mine/',        MyItemsView.as_view(),        name='item-mine'),
    path('suggestions/', SuggestionsView.as_view(),    name='item-suggestions'),
    path('<int:pk>/',    ItemDetailView.as_view(),      name='item-detail'),
]
