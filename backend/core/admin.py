from django.contrib import admin
from .models import User, Item, SwapExchange

# 1. PERSONNALISATION DE L'AFFICHAGE DES UTILISATEURS
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'first_name', 'last_name', 'contact', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)

# 2. PERSONNALISATION DE L'AFFICHAGE DES ARTICLES (ITEMS)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'category', 'condition', 'value', 'created_at')
    list_filter = ('category', 'condition', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    # On affiche 'value' car on l'a sécurisé avec default=0, null=True, blank=True
    fields = ('user', 'title', 'description', 'category', 'condition', 'value', 'emoji', 'image')

# 3. PERSONNALISATION DE L'AFFICHAGE DES ÉCHANGES (SWAPS)
class SwapExchangeAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'receiver', 'my_item', 'their_item', 'status', 'fairness', 'created_at')
    list_filter = ('status', 'fairness', 'created_at')
    search_fields = ('sender__username', 'receiver__username', 'my_item__title', 'their_item__title')

# Enregistrement de tous les modèles avec leurs configurations respectives
admin.site.register(User, UserAdmin)
admin.site.register(Item, ItemAdmin)
admin.site.register(SwapExchange, SwapExchangeAdmin)