"""
apps/notifications/models.py

Mirrors AppContext notification shape:
  id, userId, type, message, read, exchangeId, contact, createdAt
"""
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('proposal', 'Swap Proposal'),
        ('accepted', 'Swap Accepted'),
        ('rejected', 'Swap Rejected'),
        ('review',   'New Review'),
    ]

    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    type        = models.CharField(max_length=15, choices=TYPE_CHOICES)
    message     = models.TextField()
    read        = models.BooleanField(default=False)
    exchange_id = models.IntegerField(null=True, blank=True)  # soft FK for simplicity
    contact     = models.CharField(max_length=50, blank=True, default='')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] → {self.user}: {self.message[:40]}'
