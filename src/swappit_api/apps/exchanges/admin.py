from django.contrib import admin
from .models import Exchange

@admin.register(Exchange)
class ExchangeAdmin(admin.ModelAdmin):
    list_display  = ['pk', 'proposer', 'owner', 'status', 'fairness', 'created_at']
    list_filter   = ['status', 'fairness']
    search_fields = ['proposer__email', 'owner__email']
