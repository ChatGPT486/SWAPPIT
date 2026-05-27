"""
apps/users/models.py

Custom User model — mirrors the shape of SEED_USERS in AppContext.jsx:
  id, firstName, lastName, email, password, contact, bio,
  photo, joinedAt, stars, reviewCount, swapCount, role
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', 'admin')
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Matches AppContext fields: firstName, lastName, email, contact,
    bio, photo, joinedAt, stars, reviewCount, swapCount, role
    """
    ROLE_CHOICES = [('member', 'Member'), ('admin', 'Admin')]

    # Identity
    first_name   = models.CharField(max_length=80)
    last_name    = models.CharField(max_length=80)
    email        = models.EmailField(unique=True)
    contact      = models.CharField(max_length=30, blank=True, default='')
    bio          = models.TextField(blank=True, default='')
    photo        = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # Meta
    joined_at    = models.DateField(auto_now_add=True)
    role         = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')

    # Reputation — computed/updated by review signals
    stars        = models.FloatField(default=0.0)
    review_count = models.PositiveIntegerField(default=0)
    swap_count   = models.PositiveIntegerField(default=0)

    # Django internals
    is_active    = models.BooleanField(default=True)
    is_staff     = models.BooleanField(default=False)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        ordering = ['-joined_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name} <{self.email}>'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'
