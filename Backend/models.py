from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        # FIX: generate a unique username from email to avoid UNIQUE constraint errors
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while self.model.objects.filter(username=username).exists():
            username = f'{base_username}{counter}'
            counter += 1
        extra_fields.setdefault('username', username)
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    email   = models.EmailField(unique=True)
    contact = models.CharField(max_length=100, blank=True, default='')
    bio     = models.TextField(blank=True, default='')
    avatar  = models.URLField(blank=True, null=True)
    stars   = models.FloatField(default=0.0)
    swap_count   = models.IntegerField(default=0)
    review_count = models.IntegerField(default=0)  # FIX: was missing

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.full_name or self.email

    # FIX: add full_name property — used in serializers, seed, and views
    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.email

    # FIX: trust label used by frontend
    @property
    def trust_label(self):
        if self.swap_count >= 10 and self.stars >= 4.5:
            return 'Top Swapper'
        elif self.swap_count >= 5 and self.stars >= 3.5:
            return 'Trusted'
        elif self.swap_count >= 1:
            return 'Active'
        return 'New'

    def update_reputation(self):
        from django.db.models import Avg, Count
        r = self.received_reviews.aggregate(avg=Avg('stars'), total=Count('id'))
        self.stars        = round(r['avg'] or 0.0, 2)
        self.review_count = r['total']
        self.save(update_fields=['stars', 'review_count'])


class Item(models.Model):
    owner       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='items')
    name        = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    category    = models.CharField(max_length=100, blank=True, default='General')
    condition   = models.CharField(max_length=100, blank=True, default='Good')
    value       = models.IntegerField(default=0)
    available   = models.BooleanField(default=True)  # FIX: kept as 'available' to match existing DB
    image       = models.URLField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.value} FCFA)'

    @property
    def is_available(self):
        """Alias so views can use either field name."""
        return self.available

    @property
    def effective_value(self):
        return float(self.value)

    @property
    def emoji(self):
        return {
            'Electronics': '📱', 'Clothing': '👕', 'Furniture': '🪑',
            'Books': '📚', 'Music': '🎸', 'Sports': '⚽',
        }.get(self.category, '📦')

    def mark_swapped(self):
        self.available = False
        self.save(update_fields=['available'])


class Exchange(models.Model):
    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    proposer       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_exchanges')
    owner          = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_exchanges')
    offered_item   = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='offered_in')
    requested_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='requested_in')
    status         = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    meet_location  = models.CharField(max_length=200, blank=True, default='')
    meet_date      = models.CharField(max_length=100, blank=True, default='')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Exchange #{self.pk} [{self.status}]'

    @property
    def is_pending(self):
        return self.status == self.Status.PENDING

    @property
    def fairness(self):
        """Computed fairness — returned in serializer as read-only field."""
        offered_val   = float(self.offered_item.value)   if self.offered_item_id   else 0
        requested_val = float(self.requested_item.value) if self.requested_item_id else 0
        if not offered_val or not requested_val:
            return {'label': 'Unknown', 'icon': '❓', 'color': 'gray', 'tier': 'unknown'}
        ratio = offered_val / requested_val
        if 0.85 <= ratio <= 1.15:
            return {'label': 'Balanced',   'icon': '⚖️',  'color': '#059669', 'tier': 'balanced',   'bg': 'rgba(16,185,129,0.08)'}
        elif 0.65 <= ratio <= 1.35:
            return {'label': 'Acceptable', 'icon': '🤝',  'color': '#d97706', 'tier': 'acceptable', 'bg': 'rgba(245,158,11,0.08)'}
        return     {'label': 'Unfair',     'icon': '⚠️', 'color': '#dc2626', 'tier': 'unfair',     'bg': 'rgba(239,68,68,0.08)'}


class Review(models.Model):
    exchange  = models.ForeignKey(Exchange, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    author    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='written_reviews')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_reviews')
    stars     = models.PositiveSmallIntegerField(default=5)
    comment   = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering    = ['-created_at']
        unique_together = [['exchange', 'author']]  # FIX: prevent duplicate reviews


class Notification(models.Model):
    recipient  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type       = models.CharField(max_length=30, default='info')
    message    = models.TextField()
    exchange   = models.ForeignKey(Exchange, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    contact    = models.CharField(max_length=100, blank=True, default='')
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
