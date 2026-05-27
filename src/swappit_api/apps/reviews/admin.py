from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ['author', 'target_user', 'stars', 'created_at']
    list_filter   = ['stars']
    search_fields = ['author__email', 'target_user__email', 'comment']
