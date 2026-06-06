from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def root_view(request):
    return JsonResponse({'ok': True, 'message': 'Swappit backend is running'})


urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('swappit_api.urls')),
]
