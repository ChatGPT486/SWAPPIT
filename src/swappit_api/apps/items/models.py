"""
apps/items/models.py

Mirrors SEED_ITEMS fields from AppContext.jsx:
  id, userId, name, category, description, condition,
  value, emoji, createdAt, available, image
"""
from django.db import models
from django.conf import settings


class Item(models.Model):
    CATEGORY_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Clothing',    'Clothing'),
        ('Furniture',   'Furniture'),
        ('Books',       'Books'),
        ('Music',       'Music'),
        ('Sports',      'Sports'),
        ('Other',       'Other'),
    ]
    CONDITION_CHOICES = [
        ('Excellent', 'Excellent'),
        ('Good',      'Good'),
        ('Fair',      'Fair'),
    ]

    # Ownership
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='items',
    )

    # Core fields — match AppContext exactly
    name        = models.CharField(max_length=200)
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Other')
    description = models.TextField(blank=True, default='')
    condition   = models.CharField(max_length=10, choices=CONDITION_CHOICES, default='Good')
    value       = models.PositiveIntegerField(help_text='Estimated value in XAF (FCFA)')
    emoji       = models.CharField(max_length=10, default='📦')
    image       = models.ImageField(upload_to='items/', null=True, blank=True)
    available   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'items'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.user.first_name})'
