"""apps/exchanges/serializers.py"""
from rest_framework import serializers
from .models import Exchange
from apps.items.serializers import ItemSerializer
from apps.users.serializers import UserPublicSerializer


class ExchangeSerializer(serializers.ModelSerializer):
    """
    Read serializer — full exchange with nested items and users.
    Mirrors the exchange objects used in MySpace Exchanges tab.
    """
    proposerId          = serializers.IntegerField(source='proposer_id',           read_only=True)
    ownerId             = serializers.IntegerField(source='owner_id',               read_only=True)
    offeredItemId       = serializers.IntegerField(source='offered_item_id',        read_only=True)
    requestedItemId     = serializers.IntegerField(source='requested_item_id',      read_only=True)
    createdAt           = serializers.DateTimeField(source='created_at',            read_only=True)
    reviewedByProposer  = serializers.BooleanField(source='reviewed_by_proposer',  read_only=True)
    reviewedByOwner     = serializers.BooleanField(source='reviewed_by_owner',     read_only=True)

    # Nested for convenience in frontend
    proposer       = UserPublicSerializer(read_only=True)
    owner          = UserPublicSerializer(read_only=True)
    offeredItem    = ItemSerializer(source='offered_item',   read_only=True)
    requestedItem  = ItemSerializer(source='requested_item', read_only=True)

    class Meta:
        model  = Exchange
        fields = [
            'id',
            'proposerId', 'ownerId',
            'offeredItemId', 'requestedItemId',
            'proposer', 'owner',
            'offeredItem', 'requestedItem',
            'status', 'fairness',
            'reviewedByProposer', 'reviewedByOwner',
            'createdAt',
        ]


class ProposeExchangeSerializer(serializers.Serializer):
    """
    Write serializer for proposeExchange() — SwapModal.jsx sends:
      { offeredItemId, requestedItemId }
    """
    offeredItemId   = serializers.IntegerField()
    requestedItemId = serializers.IntegerField()


class RespondExchangeSerializer(serializers.Serializer):
    """
    Write serializer for respondExchange() — MySpace sends:
      { accepted: true|false }
    """
    accepted = serializers.BooleanField()
