"""
apps/exchanges/models.py

Mirrors AppContext exchange shape:
  id, proposerId, ownerId, offeredItemId, requestedItemId,
  status, fairness, createdAt, reviewedByProposer, reviewedByOwner
"""
from django.db import models
from django.conf import settings


class Exchange(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    FAIRNESS_CHOICES = [
        ('balanced',   'Balanced'),
        ('acceptable', 'Acceptable'),
        ('unfair',     'Unfair'),
    ]

    # Participants
    proposer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='proposed_exchanges',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_exchanges',
    )

    # Items
    offered_item = models.ForeignKey(
        'items.Item', on_delete=models.CASCADE,
        related_name='exchanges_as_offered',
    )
    requested_item = models.ForeignKey(
        'items.Item', on_delete=models.CASCADE,
        related_name='exchanges_as_requested',
    )

    # State
    status   = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    fairness = models.CharField(max_length=10, choices=FAIRNESS_CHOICES, default='balanced')

    # Review tracking (mirrors reviewedByProposer / reviewedByOwner)
    reviewed_by_proposer = models.BooleanField(default=False)
    reviewed_by_owner    = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exchanges'
        ordering = ['-created_at']

    def __str__(self):
        return f'Exchange #{self.pk}: {self.proposer} ↔ {self.owner} [{self.status}]'

    @staticmethod
    def compute_fairness(val1, val2):
        """Mirrors AppContext getFairness() / proposeExchange() logic."""
        if not val1 or not val2:
            return 'balanced'
        ratio = val1 / val2
        if ratio < 0.8 or ratio > 1.25:
            return 'unfair'
        if ratio < 0.92 or ratio > 1.08:
            return 'acceptable'
        return 'balanced'
