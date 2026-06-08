from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Item, Exchange, Review, Notification
from .serializers import (
    UserSerializer, RegisterSerializer, ItemSerializer,
    ExchangeSerializer, ExchangeCreateSerializer,
    ReviewSerializer, NotificationSerializer,
)

User = get_user_model()


def health(request):
    return JsonResponse({'ok': True, 'message': 'Swappit backend is running'})


class LoginView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.filter(email=request.data.get('email')).first()
        return Response({
            'access': response.data['access'],
            'refresh': response.data['refresh'],
            'user': UserSerializer(user).data,
        })


class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except Exception:
            pass
        return Response({'ok': True})


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class MeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Item.objects.select_related('owner').all()
        if self.request.query_params.get('exclude_own') == 'true':
            qs = qs.exclude(owner=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Item.objects.select_related('owner').filter(owner=self.request.user)


class MyItemsView(generics.ListAPIView):
    serializer_class = ItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Item.objects.select_related('owner').filter(owner=self.request.user)


class SuggestionsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        mine = Item.objects.filter(owner=request.user, available=True)
        theirs = Item.objects.exclude(owner=request.user).filter(available=True)
        suggestions = []
        for my in mine:
            for their in theirs:
                ratio = my.value / their.value if their.value else 0
                if 0.75 <= ratio <= 1.35:
                    suggestions.append({
                        'my_item': ItemSerializer(my).data,
                        'their_item': ItemSerializer(their).data,
                        'fairness': {'label': 'Balanced' if 0.85 <= ratio <= 1.15 else 'Acceptable', 'tier': 'balanced' if 0.85 <= ratio <= 1.15 else 'acceptable'},
                    })
        return Response({'results': suggestions[:10]})


class ExchangeListCreateView(generics.ListCreateAPIView):
    serializer_class = ExchangeSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Exchange.objects.select_related('proposer', 'owner', 'offered_item', 'requested_item').filter(Q(proposer=self.request.user) | Q(owner=self.request.user))

    def get_serializer_class(self):
        return ExchangeCreateSerializer if self.request.method == 'POST' else ExchangeSerializer

    def perform_create(self, serializer):
        offered = serializer.validated_data['offered_item']
        requested = serializer.validated_data['requested_item']
        exchange = serializer.save(proposer=self.request.user, owner=requested.owner)
        Notification.objects.create(
            recipient=requested.owner,
            type='proposal',
            message=f'{self.request.user.get_full_name()} wants to swap for "{requested.name}".',
            exchange=exchange,
        )


class ExchangeRespondView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        exchange = get_object_or_404(Exchange, pk=pk)
        if exchange.owner_id != request.user.id:
            return Response({'detail': 'Only the owner can respond.'}, status=403)
        action = request.data.get('action', '').lower()
        if action == 'accept':
            exchange.status = 'accepted'
            exchange.offered_item.mark_swapped()
            exchange.requested_item.mark_swapped()
            exchange.save(update_fields=['status'])
            Notification.objects.create(recipient=exchange.proposer, type='accepted', message=f'{request.user.get_full_name()} accepted your swap.', exchange=exchange)
        elif action == 'reject':
            exchange.status = 'rejected'
            exchange.save(update_fields=['status'])
            Notification.objects.create(recipient=exchange.proposer, type='rejected', message=f'{request.user.get_full_name()} declined your swap.', exchange=exchange)
        else:
            return Response({'detail': 'action must be accept or reject.'}, status=400)
        return Response(ExchangeSerializer(exchange).data)


class FairnessView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        offered = get_object_or_404(Item, pk=request.query_params.get('offered'))
        requested = get_object_or_404(Item, pk=request.query_params.get('requested'))
        ratio = offered.value / requested.value if requested.value else 0
        if 0.85 <= ratio <= 1.15:
            fairness = {'label': 'Balanced', 'icon': '⚖️', 'color': '#059669', 'tier': 'balanced'}
        elif 0.65 <= ratio <= 1.35:
            fairness = {'label': 'Acceptable', 'icon': '🤝', 'color': '#d97706', 'tier': 'acceptable'}
        else:
            fairness = {'label': 'Unfair', 'icon': '⚠️', 'color': '#dc2626', 'tier': 'unfair'}
        return Response({'offered_value': offered.value, 'requested_value': requested.value, 'fairness': fairness})


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user_id = self.request.query_params.get('user')
        return Review.objects.filter(recipient_id=user_id) if user_id else Review.objects.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class UnreadCountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response({'unread_count': Notification.objects.filter(recipient=request.user, is_read=False).count()})


class MarkReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notif).data)


class MarkAllReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'ok': True})


# ── Image Upload ───────────────────────────────────────────────────────────────

import os, uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class UploadImageView(APIView):
    """
    POST /api/upload-image
    Accepts a multipart/form-data file under key 'image'.
    Returns { "url": "<public URL to image>" }
    Stores files in MEDIA_ROOT/uploads/<uuid>.<ext>
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided.'}, status=400)

        # Validate it's an image
        allowed = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
        if file.content_type not in allowed:
            return Response({'error': 'Invalid file type. Use JPEG, PNG, GIF or WebP.'}, status=400)

        # Size limit: 10 MB
        if file.size > 10 * 1024 * 1024:
            return Response({'error': 'File too large. Max 10 MB.'}, status=400)

        ext      = os.path.splitext(file.name)[1].lower() or '.jpg'
        filename = f'uploads/{uuid.uuid4().hex}{ext}'

        saved_path = default_storage.save(filename, ContentFile(file.read()))

        # Build absolute public URL
        request_base = request.build_absolute_uri('/').rstrip('/')
        url = f"{request_base}{settings.MEDIA_URL}{saved_path}"

        return Response({'url': url})