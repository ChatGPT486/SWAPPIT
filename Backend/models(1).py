from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Type(models.TextChoices):
        PROPOSAL = 'proposal', 'Proposal'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        REVIEW   = 'review',   'Review'

    recipient  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    exchange   = models.ForeignKey('exchanges.Exchange', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    type       = models.CharField(max_length=20, choices=Type.choices, default=Type.PROPOSAL)
    message    = models.TextField()
    contact    = models.CharField(max_length=50, blank=True, default='')
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
