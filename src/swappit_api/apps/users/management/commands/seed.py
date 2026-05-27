"""
apps/users/management/commands/seed.py

Populates the database with the same demo data that was hardcoded
in AppContext.jsx (SEED_USERS, SEED_ITEMS, SEED_REVIEWS).

Usage:
  python manage.py seed
  python manage.py seed --flush   # wipe all data first
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with SWAPPIT demo data'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true',
                            help='Delete all existing data before seeding')

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('🗑  Flushing existing data…')
            from apps.reviews.models import Review
            from apps.exchanges.models import Exchange
            from apps.notifications.models import Notification
            from apps.items.models import Item
            Review.objects.all().delete()
            Exchange.objects.all().delete()
            Notification.objects.all().delete()
            Item.objects.all().delete()
            User.objects.all().delete()
            self.stdout.write('   Done.\n')

        # ── Users ──────────────────────────────────────────────────────────────
        self.stdout.write('👥 Creating users…')
        seed_users = [
            dict(email='armel@example.com',   password='pass123',
                 first_name='Armel',   last_name='Kamga',
                 contact='+237 6 71 23 45 67',
                 bio='Gadget collector and tech lover. Based in Douala.',
                 stars=4.8, review_count=12, swap_count=15),
            dict(email='diane@example.com',   password='pass123',
                 first_name='Diane',   last_name='Mbarga',
                 contact='+237 6 52 87 34 12',
                 bio='Fashion lover and bookworm. Yaoundé.',
                 stars=4.5, review_count=8, swap_count=10),
            dict(email='patrick@example.com', password='pass123',
                 first_name='Patrick', last_name='Nkeng',
                 contact='+237 6 93 45 78 23',
                 bio='Tech enthusiast. Bafoussam.',
                 stars=3.9, review_count=5, swap_count=6),
        ]
        created_users = {}
        for u in seed_users:
            pw = u.pop('password')
            stars        = u.pop('stars',        0)
            review_count = u.pop('review_count', 0)
            swap_count   = u.pop('swap_count',   0)
            user, created = User.objects.get_or_create(email=u['email'], defaults=u)
            if created:
                user.set_password(pw)
                user.stars        = stars
                user.review_count = review_count
                user.swap_count   = swap_count
                user.save()
                self.stdout.write(f'   ✓ Created {user.first_name} {user.last_name}')
            else:
                self.stdout.write(f'   – {user.first_name} already exists, skipping')
            created_users[user.email] = user

        armel   = created_users['armel@example.com']
        diane   = created_users['diane@example.com']
        patrick = created_users['patrick@example.com']

        # ── Items ──────────────────────────────────────────────────────────────
        self.stdout.write('\n📦 Creating items…')
        from apps.items.models import Item
        seed_items = [
            dict(user=armel,   name='iPhone 13 Pro',         category='Electronics',
                 description='Excellent condition, 128GB, midnight black. Comes with original charger and box.',
                 condition='Excellent', value=180000, emoji='📱'),
            dict(user=diane,   name='Nike Air Max 270',       category='Clothing',
                 description='Worn twice, size 42, white/grey colorway. No visible defects.',
                 condition='Good', value=55000, emoji='👟'),
            dict(user=patrick, name='Book Collection (×12)',  category='Books',
                 description='12 novels including classics and contemporary fiction.',
                 condition='Good', value=25000, emoji='📚'),
            dict(user=armel,   name='Sony WH-1000XM4',        category='Electronics',
                 description='Noise-cancelling headphones, black. Minor scratch on right earcup.',
                 condition='Good', value=95000, emoji='🎧'),
            dict(user=diane,   name='Canon EOS 200D',          category='Electronics',
                 description='Entry-level DSLR, 24.1MP. Includes 18-55mm kit lens.',
                 condition='Excellent', value=220000, emoji='📷'),
            dict(user=patrick, name='Ergonomic Office Chair',  category='Furniture',
                 description='Mesh back ergonomic chair. Adjustable height.',
                 condition='Good', value=45000, emoji='🪑'),
            dict(user=diane,   name='Samsung Galaxy Tab S7',   category='Electronics',
                 description='11-inch tablet, 128GB, Wi-Fi. Comes with S-Pen.',
                 condition='Good', value=140000, emoji='📲'),
            dict(user=patrick, name='Yamaha F310 Guitar',      category='Music',
                 description='Acoustic guitar. Includes soft case.',
                 condition='Good', value=60000, emoji='🎸'),
        ]
        created_items = []
        for item_data in seed_items:
            item, created = Item.objects.get_or_create(
                user=item_data['user'], name=item_data['name'],
                defaults=item_data
            )
            if created:
                self.stdout.write(f'   ✓ {item.emoji}  {item.name}')
            created_items.append(item)

        # ── Reviews ────────────────────────────────────────────────────────────
        self.stdout.write('\n⭐ Creating reviews…')
        from apps.reviews.models import Review
        seed_reviews = [
            dict(author=diane,   target_user=armel,   stars=5,
                 comment='Armel was super responsive and the iPhone was exactly as described. Very trustworthy!'),
            dict(author=patrick, target_user=armel,   stars=5,
                 comment='Smooth exchange, item in perfect condition. Highly recommended!'),
            dict(author=armel,   target_user=diane,   stars=4,
                 comment='Diane was friendly and the shoes were as advertised. Would swap again.'),
            dict(author=patrick, target_user=diane,   stars=5,
                 comment='Great experience. Very honest about item condition.'),
            dict(author=armel,   target_user=patrick, stars=4,
                 comment='Patrick showed up on time and the books were in great shape.'),
        ]
        for r in seed_reviews:
            _, created = Review.objects.get_or_create(
                author=r['author'], target_user=r['target_user'],
                exchange=None,
                defaults={'stars': r['stars'], 'comment': r['comment']}
            )
            if created:
                self.stdout.write(f'   ✓ {r["author"].first_name} → {r["target_user"].first_name}: {r["stars"]}★')

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete! Demo accounts:'))
        self.stdout.write('   armel@example.com   / pass123')
        self.stdout.write('   diane@example.com   / pass123')
        self.stdout.write('   patrick@example.com / pass123')
