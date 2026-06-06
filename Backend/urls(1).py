from django.urls import path
from . import views

urlpatterns = [
    path('notifications',               views.NotificationListView.as_view(),        name='notif-list'),
    path('notifications/unread-count',  views.UnreadCountView.as_view(),             name='unread-count'),
    path('notifications/read-all',      views.NotificationMarkAllReadView.as_view(), name='read-all'),
    path('notifications/<int:pk>/read', views.NotificationMarkReadView.as_view(),    name='read-one'),
]
