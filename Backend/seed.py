from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from swappit_api.models import Item

User = get_user_model()

USERS = [
    {'email': 'armel@example.com',   'first_name': 'Armel',   'last_name': 'Kamga',  'contact': '+237 691 234 567', 'bio': 'Tech lover from Douala.'},
    {'email': 'diane@example.com',   'first_name': 'Diane',   'last_name': 'Mbarga', 'contact': '+237 677 345 678', 'bio': 'Fashion enthusiast, Yaoundé.'},
    {'email': 'patrick@example.com', 'first_name': 'Patrick', 'last_name': 'Nkeng',  'contact': '+237 655 456 789', 'bio': 'Book lover, Bafoussam.'},
]

ITEMS = [
    {'email': 'armel@example.com',   'name': 'iPhone 13 Pro',       'category': 'Electronics', 'condition': 'Good',      'value': 180000, 'description': '128GB, Space Grey, original box.'},
    {'email': 'armel@example.com',   'name': 'Sony WH-1000XM4',     'category': 'Electronics', 'condition': 'Excellent', 'value': 95000,  'description': 'Noise-cancelling, barely used.'},
    {'email': 'armel@example.com',   'name': 'Acoustic Guitar',     'category': 'Music',       'condition': 'Good',      'value': 60000,  'description': 'Yamaha F310 with soft case.'},
    {'email': 'diane@example.com',   'name': 'Nike Air Max 270',    'category': 'Clothing',    'condition': 'Good',      'value': 55000,  'description': 'Size 42, worn twice.'},
    {'email': 'diane@example.com',   'name': 'Canon EOS 200D',      'category': 'Electronics', 'condition': 'Excellent', 'value': 220000, 'description': '24MP DSLR with 18-55mm lens.'},
    {'email': 'diane@example.com',   'name': 'Office Chair',        'category': 'Furniture',   'condition': 'Good',      'value': 45000,  'description': 'Ergonomic mesh back, adjustable.'},
    {'email': 'patrick@example.com', 'name': 'Book Collection ×12', 'category': 'Books',       'condition': 'Good',      'value': 25000,  'description': 'Fiction and non-fiction classics.'},
    {'email': 'patrick@example.com', 'name': 'Football Boots',      'category': 'Sports',      'condition': 'Good',      'value': 35000,  'description': 'Adidas, size 44, one season.'},
]


class Command(BaseCommand):
    help = 'Seed demo users and items (safe to run multiple times)'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding...')
        user_map = {}

        for u in USERS:
            existing = User.objects.filter(email=u['email']).first()
            if existing:
                self.stdout.write(f'  ⏭  Exists: {existing.full_name}')
                user_map[u['email']] = existing
            else:
                # Use create_user so password is hashed AND username is auto-generated
                new_user = User.objects.create_user(password='pass123', **u)
                self.stdout.write(f'  ✅ Created: {new_user.full_name}')
                user_map[u['email']] = new_user

        for item_data in ITEMS:
            email = item_data['email']
            owner = user_map[email]
            _, created = Item.objects.get_or_create(
                owner=owner,
                name=item_data['name'],
                defaults={
                    'category':    item_data['category'],
                    'condition':   item_data['condition'],
                    'value':       item_data['value'],
                    'description': item_data['description'],
                    'available':   True,
                }
            )
            if created:
                self.stdout.write(f'  📦 Item: {item_data["name"]}')

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete! Login: armel@example.com / pass123'))
