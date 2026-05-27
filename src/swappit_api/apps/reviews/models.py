"""
apps/reviews/models.py

Mirrors SEED_REVIEWS:
  id, authorId, targetUserId, exchangeId, stars, comment, createdAt
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    author      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given'
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_received'
    )
    exchange    = models.ForeignKey(
        'exchanges.Exchange', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviews',
    )
    stars      = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment    = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        # One review per (author, exchange) pair
        unique_together = [['author', 'exchange']]

    def __str__(self):
        return f'Review by {self.author} → {self.target_user}: {self.stars}★'
