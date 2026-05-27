"""
SWAPPIT — Root URL Configuration

All API routes are prefixed with /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth (JWT) ────────────────────────────────────────────────────────────
    path('api/v1/auth/', include('apps.users.urls')),

    # ── Resources ─────────────────────────────────────────────────────────────
    path('api/v1/items/',         include('apps.items.urls')),
    path('api/v1/exchanges/',     include('apps.exchanges.urls')),
    path('api/v1/reviews/',       include('apps.reviews.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
