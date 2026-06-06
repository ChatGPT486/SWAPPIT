from django.contrib.auth import get_user_model
from django.db.models import Q, F
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Item, Exchange, Review, Notification
from .serializers import (
    UserSerializer, RegisterSerializer,
    ItemSerializer, ExchangeSerializer, ExchangeCreateSerializer,
    ReviewSerializer, ReviewCreateSerializer, NotificationSerializer,
)

User = get_user_model()


def health(request):
    return JsonResponse({'ok': True, 'message': 'Swappit backend is running'})


# ── Auth ───────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    FIX: super().post() already validates; we fetch user safely after.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.filter(email=request.data.get('email')).first()
            return Response({
                'access':  response.data['access'],
                'refresh': response.data['refresh'],
                'user':    UserSerializer(user, context={'request': request}).data,
            })
        return response


class RegisterView(APIView):
    """POST /api/auth/register"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """POST /api/auth/logout — blacklists refresh token"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            RefreshToken(request.data.get('refresh')).blacklist()
        except Exception:
            pass
        return Response({'ok': True})


# ── Users ──────────────────────────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    """GET /api/users"""
    queryset           = User.objects.all().order_by('-date_joined')
    serializer_class   = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class UserDetailView(generics.RetrieveAPIView):
    """GET /api/users/<pk>"""
    queryset           = User.objects.all()
    serializer_class   = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class MeView(APIView):
    """GET / PATCH /api/users/me"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        # FIX: partial=True so only changed fields need to be sent
        serializer = UserSerializer(
            request.user, data=request.data,
            partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ── Items ──────────────────────────────────────────────────────────────────────

class ItemListCreateView(generics.ListCreateAPIView):
    """GET /api/items  |  POST /api/items"""
    serializer_class   = ItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Item.objects.select_related('owner').filter(available=True)
        if self.request.query_params.get('exclude_own') == 'true':
            qs = qs.exclude(owner=self.request.user)
        category = self.request.query_params.get('category')
        if category and category != 'All':
            qs = qs.filter(category=category)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/items/<pk>   — any authenticated user can view
    PATCH/DELETE          — only the owner
    FIX: was filtering by owner so GET by non-owner returned 404
    """
    serializer_class   = ItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Item.objects.select_related('owner').all()  # FIX: no owner filter on GET

    def update(self, request, *args, **kwargs):
        item = self.get_object()
        if item.owner != request.user:
            return Response({'detail': 'You do not own this item.'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        if item.owner != request.user:
            return Response({'detail': 'You do not own this item.'}, status=403)
        return super().destroy(request, *args, **kwargs)


class MyItemsView(generics.ListAPIView):
    """GET /api/items/mine — all items of current user including unavailable"""
    serializer_class   = ItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Item.objects.select_related('owner').filter(owner=self.request.user)


class SuggestionsView(APIView):
    """GET /api/items/suggestions — smart value-matched swap suggestions"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        mine   = list(Item.objects.filter(owner=request.user, available=True))
        theirs = list(Item.objects.exclude(owner=request.user).filter(available=True).select_related('owner'))
        suggestions = []
        for my in mine:
            for their in theirs:
                if not their.value:
                    continue
                ratio = my.value / their.value
                if 0.65 <= ratio <= 1.35:
                    if 0.85 <= ratio <= 1.15:
                        fairness = {'label': 'Balanced',   'icon': '⚖️',  'color': '#059669', 'tier': 'balanced',   'bg': 'rgba(16,185,129,0.08)'}
                    else:
                        fairness = {'label': 'Acceptable', 'icon': '🤝',  'color': '#d97706', 'tier': 'acceptable', 'bg': 'rgba(245,158,11,0.08)'}
                    suggestions.append({
                        'my_item':    ItemSerializer(my,    context={'request': request}).data,
                        'their_item': ItemSerializer(their, context={'request': request}).data,
                        'fairness':   fairness,
                    })
        # Sort by closest value match
        suggestions.sort(key=lambda s: abs(1 - s['my_item']['value'] / s['their_item']['value']))
        return Response(suggestions[:10])


# ── Exchanges ──────────────────────────────────────────────────────────────────

class ExchangeListCreateView(generics.ListCreateAPIView):
    """GET /api/exchanges  |  POST /api/exchanges"""
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        qs   = Exchange.objects.select_related(
            'proposer', 'owner', 'offered_item__owner', 'requested_item__owner'
        ).filter(Q(proposer=user) | Q(owner=user))
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return qs

    def get_serializer_class(self):
        return ExchangeCreateSerializer if self.request.method == 'POST' else ExchangeSerializer

    def create(self, request, *args, **kwargs):
        # FIX: use ExchangeCreateSerializer for write, ExchangeSerializer for read response
        serializer = ExchangeCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        exchange = serializer.save()
        return Response(
            ExchangeSerializer(exchange, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ExchangeRespondView(APIView):
    """POST /api/exchanges/<pk>/respond  — { action: accept | reject }"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        exchange = get_object_or_404(Exchange, pk=pk)

        if exchange.owner_id != request.user.id:
            return Response({'detail': 'Only the item owner can respond.'}, status=403)

        # FIX: check exchange is still pending before acting
        if exchange.status != Exchange.Status.PENDING:
            return Response({'detail': f'Exchange is already {exchange.status}.'}, status=400)

        action = request.data.get('action', '').lower()

        if action == 'accept':
            exchange.status = Exchange.Status.ACCEPTED
            exchange.save(update_fields=['status'])
            exchange.offered_item.mark_swapped()
            exchange.requested_item.mark_swapped()

            # FIX: increment swap_count for both users
            User.objects.filter(pk__in=[exchange.proposer_id, exchange.owner_id]).update(
                swap_count=F('swap_count') + 1
            )

            # FIX: include contact info in accepted notifications
            Notification.objects.bulk_create([
                Notification(
                    recipient=exchange.proposer,
                    type='accepted',
                    exchange=exchange,
                    contact=request.user.contact,
                    message=f'✅ {request.user.full_name} accepted your swap for "{exchange.requested_item.name}"!',
                ),
                Notification(
                    recipient=exchange.owner,
                    type='accepted',
                    exchange=exchange,
                    contact=exchange.proposer.contact,
                    message=f'✅ Swap accepted with {exchange.proposer.full_name}. Here is their contact.',
                ),
            ])

        elif action == 'reject':
            exchange.status = Exchange.Status.REJECTED
            exchange.save(update_fields=['status'])
            Notification.objects.create(
                recipient=exchange.proposer,
                type='rejected',
                exchange=exchange,
                message=f'❌ {request.user.full_name} declined your swap for "{exchange.requested_item.name}".',
            )
        else:
            return Response({'detail': 'action must be "accept" or "reject".'}, status=400)

        return Response(ExchangeSerializer(exchange, context={'request': request}).data)


class FairnessView(APIView):
    """GET /api/exchanges/fairness?offered=<id>&requested=<id>"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        offered   = get_object_or_404(Item, pk=request.query_params.get('offered'))
        requested = get_object_or_404(Item, pk=request.query_params.get('requested'))
        ratio = offered.value / requested.value if requested.value else 0
        if 0.85 <= ratio <= 1.15:
            fairness = {'label': 'Balanced',   'icon': '⚖️',  'color': '#059669', 'tier': 'balanced'}
        elif 0.65 <= ratio <= 1.35:
            fairness = {'label': 'Acceptable', 'icon': '🤝',  'color': '#d97706', 'tier': 'acceptable'}
        else:
            fairness = {'label': 'Unfair',     'icon': '⚠️', 'color': '#dc2626', 'tier': 'unfair'}
        return Response({
            'offered_value':   offered.value,
            'requested_value': requested.value,
            'fairness':        fairness,
        })


# ── Reviews ────────────────────────────────────────────────────────────────────

class ReviewListCreateView(generics.ListCreateAPIView):
    """GET /api/reviews  |  POST /api/reviews"""
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user_id = self.request.query_params.get('user')
        if user_id:
            return Review.objects.select_related('author', 'recipient').filter(recipient_id=user_id)
        return Review.objects.select_related('author', 'recipient').filter(recipient=self.request.user)

    def get_serializer_class(self):
        return ReviewCreateSerializer if self.request.method == 'POST' else ReviewSerializer

    def create(self, request, *args, **kwargs):
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            ReviewSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


# ── Notifications ──────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    """GET /api/notifications  |  ?unread=true"""
    serializer_class   = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(is_read=False)
        return qs


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class MarkReadView(APIView):
    """POST /api/notifications/<pk>/read"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notif).data)


class MarkAllReadView(APIView):
    """POST /api/notifications/read-all"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'ok': True, 'marked': count})
