"""
apps/reviews/views.py

Endpoints:
  GET  /api/v1/reviews/?userId=<id>  → getUserReviews(userId)
  POST /api/v1/reviews/              → addReview()
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
from django.db.models import Avg

from apps.exchanges.models import Exchange
from apps.notifications.utils import push_notification

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer

User = get_user_model()


class ReviewListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/v1/reviews/?userId=<id>
        Returns all reviews for a given user (mirrors getUserReviews).
        """
        user_id = request.query_params.get('userId')
        if not user_id:
            return Response({'error': 'userId query param is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        reviews = Review.objects.filter(target_user_id=user_id).select_related('author')
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request):
        """
        POST /api/v1/reviews/
        Mirrors addReview() from AppContext:
          1. Create review
          2. Recalculate target user's avg stars + review_count
          3. Mark exchange as reviewed by this user
          4. Push notification to target
        """
        ser = ReviewCreateSerializer(data=request.data)
        if not ser.is_valid():
            return Response({'ok': False, 'errors': ser.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        data         = ser.validated_data
        target_id    = data['targetUserId']
        exchange_id  = data.get('exchangeId')

        # Validate target user exists
        try:
            target_user = User.objects.get(pk=target_id)
        except User.DoesNotExist:
            return Response({'ok': False, 'error': 'Target user not found.'},
                            status=status.HTTP_404_NOT_FOUND)

        # Validate exchange if provided
        exchange = None
        if exchange_id:
            try:
                exchange = Exchange.objects.get(pk=exchange_id)
            except Exchange.DoesNotExist:
                return Response({'ok': False, 'error': 'Exchange not found.'},
                                status=status.HTTP_404_NOT_FOUND)

            # Check canReviewExchange: accepted and not already reviewed by this user
            if exchange.status != 'accepted':
                return Response({'ok': False, 'error': 'Exchange is not accepted.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if exchange.proposer_id == request.user.pk and exchange.reviewed_by_proposer:
                return Response({'ok': False, 'error': 'Already reviewed this exchange.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if exchange.owner_id == request.user.pk and exchange.reviewed_by_owner:
                return Response({'ok': False, 'error': 'Already reviewed this exchange.'},
                                status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            author      = request.user,
            target_user = target_user,
            exchange    = exchange,
            stars       = data['stars'],
            comment     = data.get('comment', ''),
        )

        # ── Recalculate stars + review_count (mirrors AppContext logic) ────────
        agg = Review.objects.filter(target_user=target_user).aggregate(avg=Avg('stars'))
        new_avg   = round(agg['avg'] or 0, 1)
        new_count = Review.objects.filter(target_user=target_user).count()
        target_user.stars        = new_avg
        target_user.review_count = new_count
        target_user.save(update_fields=['stars', 'review_count'])

        # ── Mark exchange as reviewed ──────────────────────────────────────────
        if exchange:
            if exchange.proposer_id == request.user.pk:
                exchange.reviewed_by_proposer = True
            elif exchange.owner_id == request.user.pk:
                exchange.reviewed_by_owner = True
            exchange.save(update_fields=['reviewed_by_proposer', 'reviewed_by_owner'])

        # ── Notify target ──────────────────────────────────────────────────────
        snippet = data.get('comment', '')
        if len(snippet) > 50:
            snippet = snippet[:50] + '…'
        push_notification(
            user_id     = target_id,
            type        = 'review',
            exchange_id = exchange_id,
            message     = (f'{request.user.first_name} gave you {data["stars"]} '
                           f'star{"s" if data["stars"] != 1 else ""}: "{snippet}"'),
        )

        return Response(
            {'ok': True, 'review': ReviewSerializer(review).data},
            status=status.HTTP_201_CREATED
        )
