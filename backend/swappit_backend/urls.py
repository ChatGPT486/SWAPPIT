from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import (
    signup_view, signin_view,
    item_list_create, item_detail_view, get_items,
    MySpaceView,
    create_swap, respond_swap, my_swaps
)
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "Swappit Admin"
admin.site.site_title = "Swappit Admin Portal"

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT standard (utile comme fallback)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Auth custom (retourne user + tokens)
    path('api/signup/', signup_view, name='api_signup'),
    path('api/signin/', signin_view, name='api_signin'),  # ← utilise cette route !

    # Articles
    path('api/items/', item_list_create, name='item-list-create'),
    path('api/items/<int:pk>/', item_detail_view, name='item-detail'),
    path('api/get_items/', get_items, name='get-items'),

    # Espace personnel
    path('api/myspace/', MySpaceView.as_view(), name='user-myspace'),

    # ============ SYSTÈME DE TROC ============
    path('api/swaps/', create_swap, name='swap-create'),          # POST : proposer un troc
    path('api/swaps/<int:swap_id>/respond/', respond_swap, name='swap-respond'),  # PATCH : accepter/refuser
    path('api/swaps/mine/', my_swaps, name='my-swaps'),           # GET : voir ses swaps
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
