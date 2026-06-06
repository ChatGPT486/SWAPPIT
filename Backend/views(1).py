from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications  |  ?unread=true"""
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(is_read=False)
        return qs


class NotificationMarkReadView(APIView):
    """POST /api/notifications/<pk>/read"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        n = get_object_or_404(Notification, pk=pk, recipient=request.user)
        n.mark_read()
        return Response(NotificationSerializer(n).data)


class NotificationMarkAllReadView(APIView):
    """POST /api/notifications/read-all"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'detail': f'{count} notifications marked as read.'})


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'unread_count': Notification.objects.filter(recipient=request.user, is_read=False).count()})
