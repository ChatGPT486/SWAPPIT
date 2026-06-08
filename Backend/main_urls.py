from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


def root_view(request):
    return JsonResponse({'ok': True, 'message': 'Swappit backend is running'})


urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('swappit_api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
