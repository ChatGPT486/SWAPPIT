"""
Management command: python manage.py seed_data
Seeds the database with demo users, items, and an exchange for testing.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from items.models import Item
from exchanges.models import Exchange

User = get_user_model()

USERS = [
    {'email': 'armel@example.com',   'first_name': 'Armel',   'last_name': 'Kamga',   'contact': '+237 691 234 567', 'bio': 'Tech lover from Douala. Always looking for a good deal.'},
    {'email': 'diane@example.com',   'first_name': 'Diane',   'last_name': 'Mballa',  'contact': '+237 677 345 678', 'bio': 'Fashion enthusiast based in Yaoundé.'},
    {'email': 'patrick@example.com', 'first_name': 'Patrick', 'last_name': 'Nguele',  'contact': '+237 655 456 789', 'bio': 'Book lover and sports fan from Bafoussam.'},
]

ITEMS = [
    {'user': 'armel@example.com',   'name': 'iPhone 13 Pro',         'category': 'Electronics', 'condition': 'Good',      'value': 180000, 'description': '128GB, Space Grey, comes with original box and charger. Minor scratches.'},
    {'user': 'armel@example.com',   'name': 'Sony Headphones WH-1000XM4', 'category': 'Electronics', 'condition': 'Excellent', 'value': 95000, 'description': 'Noise-cancelling, barely used. Great sound quality.'},
    {'user': 'diane@example.com',   'name': 'Nike Air Max 270',       'category': 'Clothing',    'condition': 'Good',      'value': 55000,  'description': 'Size 42, worn twice, still in great shape.'},
    {'user': 'diane@example.com',   'name': 'Leather Handbag',        'category': 'Clothing',    'condition': 'Excellent', 'value': 40000,  'description': 'Genuine leather, black, brand new condition.'},
    {'user': 'patrick@example.com', 'name': 'Book Collection (10 pcs)', 'category': 'Books',    'condition': 'Good',      'value': 25000,  'description': 'Mix of fiction and business books. Authors include Coelho and Gladwell.'},
    {'user': 'patrick@example.com', 'name': 'Football Boots Adidas',  'category': 'Sports',      'condition': 'Good',      'value': 35000,  'description': 'Size 44, used one season. Still good quality.'},
    {'user': 'armel@example.com',   'name': 'Acoustic Guitar',        'category': 'Music',       'condition': 'Fair',      'value': 45000,  'description': 'Yamaha beginner guitar. Some wear but plays well.'},
    {'user': 'diane@example.com',   'name': 'Office Chair',           'category': 'Furniture',   'condition': 'Good',      'value': 60000,  'description': 'Ergonomic chair with adjustable height and lumbar support.'},
]


class Command(BaseCommand):
    help = 'Seeds the database with demo data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database...')

        # Create users
        created_users = {}
        for u in USERS:
            user, created = User.objects.get_or_create(
                email=u['email'],
                defaults={**u, 'is_active': True}
            )
            if created:
                user.set_password('pass123')
                user.save()
                self.stdout.write(f'  ✅ User: {user.full_name}')
            created_users[u['email']] = user

        # Create items
        created_items = []
        for i in ITEMS:
            user = created_users[i.pop('user')]
            item, created = Item.objects.get_or_create(
                owner=user, name=i['name'],
                defaults=i
            )
            if created:
                self.stdout.write(f'  📦 Item: {item.name}')
            created_items.append(item)

        self.stdout.write(self.style.SUCCESS('✅ Seed complete! Run the server and try logging in with armel@example.com / pass123'))
