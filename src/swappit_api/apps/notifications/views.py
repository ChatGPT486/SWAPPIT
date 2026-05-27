"""
apps/notifications/views.py

Endpoints:
  GET  /api/v1/notifications/           → getMyNotifications()
  POST /api/v1/notifications/<id>/read/ → markNotifRead()
  POST /api/v1/notifications/read-all/  → markAllNotifsRead()
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification


class NotificationSerializer:
    """Inline serializer (no model serializer needed — keep it light)."""
    @staticmethod
    def serialize(notif):
        return {
            'id':         notif.pk,
            'userId':     notif.user_id,
            'type':       notif.type,
            'message':    notif.message,
            'read':       notif.read,
            'exchangeId': notif.exchange_id,
            'contact':    notif.contact,
            'createdAt':  notif.created_at.isoformat(),
        }


class NotificationListView(APIView):
    """
    GET /api/v1/notifications/
    Returns all notifications for the current user, newest first.
    Mirrors getMyNotifications() + getUnreadCount().
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(user=request.user)
        data   = [NotificationSerializer.serialize(n) for n in notifs]
        unread = sum(1 for n in notifs if not n.read)
        return Response({'notifications': data, 'unreadCount': unread})


class NotificationMarkReadView(APIView):
    """
    POST /api/v1/notifications/<id>/read/
    Mirrors markNotifRead(id).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = Notification.objects.filter(
            pk=pk, user=request.user
        ).update(read=True)
        if not updated:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'ok': True})


class NotificationMarkAllReadView(APIView):
    """
    POST /api/v1/notifications/read-all/
    Mirrors markAllNotifsRead().
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'ok': True})
