"""apps/users/urls.py"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SignupView, SigninView, SignoutView, MeView, UserPublicView

urlpatterns = [
    path('signup/',        SignupView.as_view(),      name='auth-signup'),
    path('signin/',        SigninView.as_view(),       name='auth-signin'),
    path('signout/',       SignoutView.as_view(),      name='auth-signout'),
    path('me/',            MeView.as_view(),           name='auth-me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/<int:pk>/', UserPublicView.as_view(),  name='user-public'),
]
