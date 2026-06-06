from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Item, Exchange, Review, Notification

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    # FIX: expose full_name and trust_label that frontend uses
    full_name    = serializers.ReadOnlyField()
    trust_label  = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'contact', 'bio', 'avatar', 'stars', 'review_count',
            'swap_count', 'trust_label', 'date_joined',
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ('email', 'first_name', 'last_name', 'password', 'contact', 'bio')

    def create(self, validated_data):
        password = validated_data.pop('password')
        # FIX: use create_user so password is hashed + username auto-generated
        return User.objects.create_user(password=password, **validated_data)


class ItemSerializer(serializers.ModelSerializer):
    owner          = UserSerializer(read_only=True)
    emoji          = serializers.ReadOnlyField()
    effective_value = serializers.ReadOnlyField()
    # FIX: expose 'available' as 'is_available' alias so frontend works with both names
    is_available   = serializers.ReadOnlyField(source='available')

    class Meta:
        model  = Item
        fields = (
            'id', 'owner', 'name', 'description', 'category', 'condition',
            'value', 'effective_value', 'image', 'emoji',
            'available', 'is_available', 'created_at',
        )


class ExchangeSerializer(serializers.ModelSerializer):
    proposer       = UserSerializer(read_only=True)
    owner          = UserSerializer(read_only=True)
    offered_item   = ItemSerializer(read_only=True)
    requested_item = ItemSerializer(read_only=True)
    # FIX: include computed fairness so frontend can show the badge
    fairness       = serializers.ReadOnlyField()

    class Meta:
        model  = Exchange
        fields = (
            'id', 'proposer', 'owner', 'offered_item', 'requested_item',
            'status', 'fairness', 'meet_location', 'meet_date', 'created_at',
        )


class ExchangeCreateSerializer(serializers.Serializer):
    """
    FIX: frontend sends offered_item_id / requested_item_id as integers.
    We validate ownership here before creating the exchange.
    """
    offered_item_id   = serializers.IntegerField()
    requested_item_id = serializers.IntegerField()
    meet_location     = serializers.CharField(required=False, allow_blank=True, default='')
    meet_date         = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        user = self.context['request'].user
        try:
            offered   = Item.objects.get(pk=attrs['offered_item_id'])
            requested = Item.objects.get(pk=attrs['requested_item_id'])
        except Item.DoesNotExist:
            raise serializers.ValidationError('One or both items not found.')

        # FIX: validate proposer owns the offered item
        if offered.owner_id != user.id:
            raise serializers.ValidationError('You do not own the offered item.')
        if requested.owner_id == user.id:
            raise serializers.ValidationError('You cannot swap with yourself.')
        if not offered.available:
            raise serializers.ValidationError('Your offered item is no longer available.')
        if not requested.available:
            raise serializers.ValidationError('The requested item is no longer available.')

        # FIX: prevent duplicate pending proposals
        if Exchange.objects.filter(
            proposer=user,
            offered_item=offered,
            requested_item=requested,
            status='pending'
        ).exists():
            raise serializers.ValidationError('You already have a pending proposal for this swap.')

        attrs['offered']   = offered
        attrs['requested'] = requested
        return attrs

    def create(self, validated_data):
        user      = self.context['request'].user
        offered   = validated_data['offered']
        requested = validated_data['requested']

        exchange = Exchange.objects.create(
            proposer=user,
            owner=requested.owner,
            offered_item=offered,
            requested_item=requested,
            meet_location=validated_data.get('meet_location', ''),
            meet_date=validated_data.get('meet_date', ''),
        )

        # Notify the owner
        Notification.objects.create(
            recipient=requested.owner,
            type='proposal',
            exchange=exchange,
            message=f'🔁 {user.full_name} wants to swap their "{offered.name}" for your "{requested.name}".',
        )
        return exchange


class ReviewSerializer(serializers.ModelSerializer):
    author    = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model  = Review
        fields = '__all__'


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Review
        fields = ('exchange', 'recipient', 'stars', 'comment')

    def validate(self, attrs):
        user     = self.context['request'].user
        exchange = attrs.get('exchange')
        recipient = attrs.get('recipient')

        if exchange and exchange.status != Exchange.Status.ACCEPTED:
            raise serializers.ValidationError('Can only review accepted exchanges.')
        if exchange and user not in [exchange.proposer, exchange.owner]:
            raise serializers.ValidationError('You were not part of this exchange.')
        if user == recipient:
            raise serializers.ValidationError('Cannot review yourself.')
        if exchange and Review.objects.filter(exchange=exchange, author=user).exists():
            raise serializers.ValidationError('You already reviewed this exchange.')
        return attrs

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        review = super().create(validated_data)
        # Update recipient's reputation score
        review.recipient.update_reputation()
        return review


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = '__all__'
