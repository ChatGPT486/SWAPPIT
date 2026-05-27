"""
apps/users/serializers.py

Serializers for signup, signin (JWT), profile read/update.
Field names use camelCase to match the React frontend exactly.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Read-only public profile — exposed on /items/ and /exchanges/ responses.
    Mirrors: { id, firstName, lastName, photo, stars, reviewCount, swapCount }
    """
    id          = serializers.IntegerField(read_only=True)
    firstName   = serializers.CharField(source='first_name', read_only=True)
    lastName    = serializers.CharField(source='last_name',  read_only=True)
    reviewCount = serializers.IntegerField(source='review_count', read_only=True)
    swapCount   = serializers.IntegerField(source='swap_count',   read_only=True)
    joinedAt    = serializers.DateField(source='joined_at', read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'firstName', 'lastName', 'photo', 'stars',
                  'reviewCount', 'swapCount', 'joinedAt', 'bio', 'contact']


class UserPrivateSerializer(serializers.ModelSerializer):
    """
    Full profile for the authenticated user — returned after login and on /auth/me/.
    """
    id          = serializers.IntegerField(read_only=True)
    firstName   = serializers.CharField(source='first_name')
    lastName    = serializers.CharField(source='last_name')
    reviewCount = serializers.IntegerField(source='review_count', read_only=True)
    swapCount   = serializers.IntegerField(source='swap_count',   read_only=True)
    joinedAt    = serializers.DateField(source='joined_at', read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'firstName', 'lastName', 'email', 'contact',
                  'bio', 'photo', 'stars', 'reviewCount', 'swapCount',
                  'joinedAt', 'role']
        read_only_fields = ['email', 'stars', 'reviewCount', 'swapCount', 'joinedAt', 'role']

    def update(self, instance, validated_data):
        # Handle nested source keys from camelCase mapping
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name  = validated_data.get('last_name',  instance.last_name)
        instance.contact    = validated_data.get('contact',    instance.contact)
        instance.bio        = validated_data.get('bio',        instance.bio)
        if 'photo' in validated_data:
            instance.photo = validated_data['photo']
        instance.save()
        return instance


class SignupSerializer(serializers.Serializer):
    """
    Mirrors the Signup form in Signup.jsx:
      firstName, lastName, email, contact, password, bio
    """
    firstName = serializers.CharField(max_length=80)
    lastName  = serializers.CharField(max_length=80)
    email     = serializers.EmailField()
    contact   = serializers.CharField(max_length=30, required=False, default='')
    password  = serializers.CharField(min_length=6, write_only=True)
    bio       = serializers.CharField(required=False, default='', allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already in use.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email      = validated_data['email'],
            password   = validated_data['password'],
            first_name = validated_data['firstName'],
            last_name  = validated_data['lastName'],
            contact    = validated_data.get('contact', ''),
            bio        = validated_data.get('bio', ''),
        )
