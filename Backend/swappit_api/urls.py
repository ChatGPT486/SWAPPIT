from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('health', views.health, name='health'),
    path('auth/login', views.LoginView.as_view(), name='login'),
    path('auth/register', views.RegisterView.as_view(), name='register'),
    path('auth/logout', views.LogoutView.as_view(), name='logout'),
    path('auth/token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('users', views.UserListView.as_view(), name='users-list'),
    path('users/me', views.MeView.as_view(), name='me'),
    path('users/<int:pk>', views.UserDetailView.as_view(), name='user-detail'),
    path('items', views.ItemListCreateView.as_view(), name='items-list'),
    path('items/mine', views.MyItemsView.as_view(), name='items-mine'),
    path('items/suggestions', views.SuggestionsView.as_view(), name='items-suggestions'),
    path('items/<int:pk>', views.ItemDetailView.as_view(), name='item-detail'),
    path('exchanges', views.ExchangeListCreateView.as_view(), name='exchange-list'),
    path('exchanges/fairness', views.FairnessView.as_view(), name='fairness'),
    path('exchanges/<int:pk>/respond', views.ExchangeRespondView.as_view(), name='exchange-respond'),
    path('reviews', views.ReviewListCreateView.as_view(), name='reviews-list'),
    path('notifications', views.NotificationListView.as_view(), name='notifications-list'),
    path('notifications/unread-count', views.UnreadCountView.as_view(), name='notifications-unread'),
    path('notifications/<int:pk>/read', views.MarkReadView.as_view(), name='notification-read'),
    path('notifications/read-all', views.MarkAllReadView.as_view(), name='notifications-read-all'),
]
