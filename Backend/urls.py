from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('health',                          views.health,                        name='health'),

    # Auth
    path('auth/login',                      views.LoginView.as_view(),           name='login'),
    path('auth/register',                   views.RegisterView.as_view(),        name='register'),
    path('auth/logout',                     views.LogoutView.as_view(),          name='logout'),
    path('auth/token/refresh',              TokenRefreshView.as_view(),          name='token-refresh'),

    # Users
    path('users',                           views.UserListView.as_view(),        name='user-list'),
    path('users/me',                        views.MeView.as_view(),              name='me'),
    path('users/<int:pk>',                  views.UserDetailView.as_view(),      name='user-detail'),

    # Items — FIX: specific paths (mine, suggestions) MUST come before <int:pk>
    path('items',                           views.ItemListCreateView.as_view(),  name='item-list'),
    path('items/mine',                      views.MyItemsView.as_view(),         name='item-mine'),
    path('items/suggestions',               views.SuggestionsView.as_view(),     name='item-suggestions'),
    path('items/<int:pk>',                  views.ItemDetailView.as_view(),      name='item-detail'),

    # Exchanges — FIX: fairness before <int:pk>/respond
    path('exchanges',                       views.ExchangeListCreateView.as_view(),  name='exchange-list'),
    path('exchanges/fairness',              views.FairnessView.as_view(),            name='fairness'),
    path('exchanges/<int:pk>/respond',      views.ExchangeRespondView.as_view(),     name='exchange-respond'),

    # Reviews
    path('reviews',                         views.ReviewListCreateView.as_view(),    name='review-list'),

    # Notifications — FIX: static paths before <int:pk>/read
    path('notifications',                   views.NotificationListView.as_view(),    name='notif-list'),
    path('notifications/unread-count',      views.UnreadCountView.as_view(),         name='notif-unread'),
    path('notifications/read-all',          views.MarkAllReadView.as_view(),         name='notif-read-all'),
    path('notifications/<int:pk>/read',     views.MarkReadView.as_view(),            name='notif-read'),
]
