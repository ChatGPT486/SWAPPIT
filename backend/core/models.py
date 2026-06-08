from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# 1. UTILISATEUR PERSONNALISÉ
class User(AbstractUser):
    contact = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar_color = models.CharField(max_length=7, default='#E8521F')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"


# 2. ARTICLES A ÉCHANGER
class Item(models.Model):
    CATEGORY_CHOICES = [
        ('Electronics', 'Electronics'),
        ('Clothing', 'Clothing'),
        ('Furniture', 'Furniture'),
        ('Books', 'Books'),
        ('Music', 'Music'),
        ('Sports', 'Sports'),
        ('Other', 'Other'),
    ]
    CONDITION_CHOICES = [
        ('NEW', 'Neuf'),
        ('LIKE_NEW', 'Très bon état'),
        ('USED', 'Utilisé'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='items')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='USED')
    value = models.IntegerField(default=0, null=True, blank=True)
    emoji = models.CharField(max_length=10, default='📦')
    image = models.URLField(
        blank=True,      # Permet de laisser le champ vide dans un formulaire
        null=True        # Permet de stocker la valeur NULL en base de données si vide
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# 3. PROPOSITIONS D'ÉCHANGES / SWAPS
class SwapExchange(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    FAIRNESS_CHOICES = [
        ('fair', 'Fair'),
        ('unfair', 'Unfair'),
        ('skewed', 'Skewed'),
    ]

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_swaps')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_swaps')
    
    my_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='initiated_swaps')
    their_item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='targeted_swaps')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    fairness = models.CharField(max_length=20, choices=FAIRNESS_CHOICES, default='fair')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Swap: {self.my_item.title} <-> {self.their_item.title} [{self.status}]"