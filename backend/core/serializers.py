from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import Item, SwapExchange

User = get_user_model()

# 1. TRANSLATEUR UTILISATEUR
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'contact', 'bio', 'avatar_color', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# 2. TRANSLATEUR ARTICLES
class ItemSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    # Permet de renvoyer item.owner__username directement pour ton composant React !
    owner__username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'user', 'user_details', 'owner__username', 'title', 
            'description', 'category', 'condition', 'value', 'emoji', 'image', 'created_at'
        ]


# 3. TRANSLATEUR ECHANGES (SWAPS)
class SwapExchangeSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    receiver_details = UserSerializer(source='receiver', read_only=True)
    
    # CORRECTION : Double exposition (Singulier + Pluriel) pour matcher à 100% avec le Frontend
    my_item_detail = ItemSerializer(source='my_item', read_only=True)
    their_item_detail = ItemSerializer(source='their_item', read_only=True)
    my_item_details = ItemSerializer(source='my_item', read_only=True)
    their_item_details = ItemSerializer(source='their_item', read_only=True)
    
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = SwapExchange
        fields = [
            'id', 'sender', 'receiver', 'my_item', 'their_item', 'status', 'fairness', 'created_at',
            'sender_details', 'receiver_details', 'my_item_detail', 'their_item_detail',
            'my_item_details', 'their_item_details', 'sender_username', 'receiver_username'
        ]