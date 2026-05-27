"""apps/items/serializers.py"""
from rest_framework import serializers
from .models import Item
from apps.users.serializers import UserPublicSerializer


class ItemSerializer(serializers.ModelSerializer):
    """
    Full item serializer — used for list and detail views.
    Mirrors the item shape used in Explorer.jsx, ItemDetail.jsx, ItemCard.jsx.
    """
    # Expose camelCase to match the frontend
    userId    = serializers.IntegerField(source='user_id',    read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    # Nested owner public profile (handy for ItemDetail owner card)
    owner     = UserPublicSerializer(source='user', read_only=True)

    class Meta:
        model  = Item
        fields = [
            'id', 'userId', 'owner',
            'name', 'category', 'description', 'condition',
            'value', 'emoji', 'image', 'available', 'createdAt',
        ]
        read_only_fields = ['id', 'userId', 'owner', 'available', 'createdAt']


class ItemCreateSerializer(serializers.ModelSerializer):
    """
    Write-only serializer for addItem() — used in MySpace.jsx add-item form.
    Accepts camelCase keys the React form sends.
    """
    class Meta:
        model  = Item
        fields = ['name', 'category', 'description', 'condition', 'value', 'emoji', 'image']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
