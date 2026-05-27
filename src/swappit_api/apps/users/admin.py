from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseAdmin):
    list_display  = ['email', 'first_name', 'last_name', 'role', 'stars', 'swap_count', 'joined_at']
    list_filter   = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering      = ['-joined_at']
    fieldsets = (
        (None,           {'fields': ('email', 'password')}),
        ('Personal',     {'fields': ('first_name', 'last_name', 'contact', 'bio', 'photo')}),
        ('Reputation',   {'fields': ('stars', 'review_count', 'swap_count')}),
        ('Permissions',  {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = ((None, {'fields': ('email', 'first_name', 'last_name', 'password1', 'password2')}),)
