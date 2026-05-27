"""
apps/notifications/utils.py

push_notification() is a shared helper called from exchange and review views.
It mirrors AppContext.pushNotification().
"""
from .models import Notification


def push_notification(user_id, type, message, exchange_id=None, contact=''):
    """
    Create a notification for a user.

    Args:
        user_id    (int): target user's pk
        type       (str): 'proposal' | 'accepted' | 'rejected' | 'review'
        message    (str): human-readable notification text
        exchange_id(int): optional exchange pk
        contact    (str): optional contact string shown on acceptance
    """
    Notification.objects.create(
        user_id     = user_id,
        type        = type,
        message     = message,
        exchange_id = exchange_id,
        contact     = contact or '',
    )
