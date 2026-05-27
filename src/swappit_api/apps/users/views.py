"""
apps/users/views.py

Endpoints:
  POST /api/v1/auth/signup/      → create account, return tokens + user
  POST /api/v1/auth/signin/      → login, return tokens + user
  POST /api/v1/auth/signout/     → blacklist refresh token
  GET  /api/v1/auth/me/          → current user profile
  PATCH/api/v1/auth/me/          → update profile (firstName, lastName, bio, contact, photo)
  GET  /api/v1/auth/users/<id>/  → public profile of any user
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from django.contrib.auth import get_user_model

from .serializers import SignupSerializer, UserPrivateSerializer, UserPublicSerializer

User = get_user_model()


def _tokens_for_user(user):
    """Return { refresh, access } token strings for a user."""
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class SignupView(APIView):
    """
    POST /api/v1/auth/signup/
    Body (JSON): { firstName, lastName, email, contact, password, bio }
    Response: { tokens: {access, refresh}, user: {...} }

    Mirrors AppContext.signup():
      - Validates unique email
      - Creates user
      - Returns JWT tokens so the frontend logs the user in immediately
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            # Flatten errors to match frontend expectations: { error: "..." }
            first_error = next(iter(serializer.errors.values()))[0]
            return Response({'ok': False, 'error': str(first_error)},
                            status=status.HTTP_400_BAD_REQUEST)

        user   = serializer.save()
        tokens = _tokens_for_user(user)
        return Response({
            'ok': True,
            'tokens': tokens,
            'user': UserPrivateSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class SigninView(APIView):
    """
    POST /api/v1/auth/signin/
    Body (JSON): { email, password }
    Response: { tokens: {access, refresh}, user: {...} }

    Mirrors AppContext.signin() — checks email + password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'ok': False, 'error': 'Invalid email or password.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'ok': False, 'error': 'Invalid email or password.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'ok': False, 'error': 'Account is disabled.'},
                            status=status.HTTP_403_FORBIDDEN)

        tokens = _tokens_for_user(user)
        return Response({
            'ok': True,
            'tokens': tokens,
            'user': UserPrivateSerializer(user).data,
        })


class SignoutView(APIView):
    """
    POST /api/v1/auth/signout/
    Body: { refresh: "<token>" }
    Blacklists the refresh token (requires simplejwt token_blacklist app).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except TokenError:
            pass  # already invalid — that's fine
        return Response({'ok': True})


class MeView(APIView):
    """
    GET  /api/v1/auth/me/   → return full profile of logged-in user
    PATCH/api/v1/auth/me/   → update firstName, lastName, bio, contact, photo
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]  # support photo uploads

    def get(self, request):
        return Response(UserPrivateSerializer(request.user).data)

    def patch(self, request):
        serializer = UserPrivateSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response({'ok': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'ok': True, 'user': serializer.data})


class UserPublicView(APIView):
    """
    GET /api/v1/auth/users/<id>/
    Returns public profile (no email/contact) for any user.
    Used by ItemDetail.jsx to show owner info.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserPublicSerializer(user).data)
