from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Item, Exchange, Review, Notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'contact', 'bio', 'avatar', 'stars', 'swap_count', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'contact', 'bio')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class ItemSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Item
        fields = '__all__'


class ExchangeSerializer(serializers.ModelSerializer):
    proposer = UserSerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    offered_item = ItemSerializer(read_only=True)
    requested_item = ItemSerializer(read_only=True)

    class Meta:
        model = Exchange
        fields = '__all__'


class ExchangeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exchange
        fields = ('offered_item', 'requested_item', 'meet_location', 'meet_date')


class ReviewSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
