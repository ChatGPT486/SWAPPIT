"""apps/reviews/serializers.py"""
from rest_framework import serializers
from .models import Review
from apps.users.serializers import UserPublicSerializer


class ReviewSerializer(serializers.ModelSerializer):
    authorId     = serializers.IntegerField(source='author_id',      read_only=True)
    targetUserId = serializers.IntegerField(source='target_user_id', read_only=True)
    exchangeId   = serializers.IntegerField(source='exchange_id',    read_only=True)
    createdAt    = serializers.DateTimeField(source='created_at',    read_only=True)
    author       = UserPublicSerializer(read_only=True)

    class Meta:
        model  = Review
        fields = ['id', 'authorId', 'targetUserId', 'exchangeId',
                  'stars', 'comment', 'createdAt', 'author']


class ReviewCreateSerializer(serializers.Serializer):
    """
    Mirrors addReview() call from ReviewModal.jsx:
      { targetUserId, exchangeId, stars, comment }
    """
    targetUserId = serializers.IntegerField()
    exchangeId   = serializers.IntegerField(required=False, allow_null=True)
    stars        = serializers.IntegerField(min_value=1, max_value=5)
    comment      = serializers.CharField(allow_blank=True, default='')
