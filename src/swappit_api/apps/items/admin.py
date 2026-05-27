from django.contrib import admin
from .models import Item

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display  = ['name', 'user', 'category', 'condition', 'value', 'available', 'created_at']
    list_filter   = ['category', 'condition', 'available']
    search_fields = ['name', 'description', 'user__email']
