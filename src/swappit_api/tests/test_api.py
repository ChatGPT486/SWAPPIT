"""
tests/test_api.py

Full test suite for the SWAPPIT API.
Covers: auth, items, exchanges, reviews, notifications.

Run with:
  python manage.py test tests
  python manage.py test tests --verbosity=2
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.items.models import Item
from apps.exchanges.models import Exchange
from apps.reviews.models import Review
from apps.notifications.models import Notification

User = get_user_model()


# ── Helpers ────────────────────────────────────────────────────────────────────
def create_user(email='test@example.com', password='pass1234',
                first_name='Test', last_name='User', **kwargs):
    return User.objects.create_user(
        email=email, password=password,
        first_name=first_name, last_name=last_name, **kwargs
    )


def create_item(user, name='Test Item', value=50000, category='Electronics',
                condition='Good', available=True):
    return Item.objects.create(
        user=user, name=name, value=value,
        category=category, condition=condition, available=available, emoji='📦'
    )


class AuthTestCase(TestCase):
    """
    Tests for /api/v1/auth/ endpoints.
    Mirrors AppContext.signup() and AppContext.signin().
    """
    def setUp(self):
        self.client = APIClient()

    def test_signup_success(self):
        res = self.client.post('/api/v1/auth/signup/', {
            'firstName': 'Armel', 'lastName': 'Kamga',
            'email': 'armel@test.com', 'password': 'pass1234',
            'contact': '+237600000000', 'bio': 'Hello',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['ok'])
        self.assertIn('access',  res.data['tokens'])
        self.assertIn('refresh', res.data['tokens'])
        self.assertEqual(res.data['user']['firstName'], 'Armel')

    def test_signup_duplicate_email(self):
        create_user(email='dup@test.com')
        res = self.client.post('/api/v1/auth/signup/', {
            'firstName': 'X', 'lastName': 'Y',
            'email': 'dup@test.com', 'password': 'pass1234',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['ok'])
        self.assertIn('Email already in use', res.data['error'])

    def test_signin_success(self):
        create_user(email='login@test.com', password='pass1234')
        res = self.client.post('/api/v1/auth/signin/',
                               {'email': 'login@test.com', 'password': 'pass1234'},
                               format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['ok'])
        self.assertIn('access', res.data['tokens'])

    def test_signin_wrong_password(self):
        create_user(email='bad@test.com', password='correct')
        res = self.client.post('/api/v1/auth/signin/',
                               {'email': 'bad@test.com', 'password': 'wrong'},
                               format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(res.data['ok'])

    def test_me_requires_auth(self):
        res = self.client.get('/api/v1/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_profile(self):
        user = create_user(email='me@test.com', first_name='Jean')
        self.client.force_authenticate(user=user)
        res = self.client.get('/api/v1/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['firstName'], 'Jean')

    def test_update_profile(self):
        user = create_user(email='update@test.com')
        self.client.force_authenticate(user=user)
        res = self.client.patch('/api/v1/auth/me/',
                                {'bio': 'New bio', 'contact': '+237999'},
                                format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.bio, 'New bio')


class ItemTestCase(TestCase):
    """Tests for /api/v1/items/ endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user1  = create_user(email='u1@test.com', first_name='Alice')
        self.user2  = create_user(email='u2@test.com', first_name='Bob')
        self.client.force_authenticate(user=self.user1)

    def test_list_items(self):
        create_item(self.user1, name='Phone')
        create_item(self.user2, name='Book')
        res = self.client.get('/api/v1/items/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_search_items(self):
        create_item(self.user1, name='iPhone 13')
        create_item(self.user2, name='Samsung Galaxy')
        res = self.client.get('/api/v1/items/?search=iphone')
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'iPhone 13')

    def test_filter_by_category(self):
        create_item(self.user1, name='Chair', category='Furniture')
        create_item(self.user2, name='Book',  category='Books')
        res = self.client.get('/api/v1/items/?category=Furniture')
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Chair')

    def test_create_item(self):
        res = self.client.post('/api/v1/items/', {
            'name': 'Headphones', 'category': 'Electronics',
            'description': 'Good ones', 'condition': 'Excellent',
            'value': 45000, 'emoji': '🎧',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['ok'])
        self.assertEqual(Item.objects.count(), 1)

    def test_delete_own_item(self):
        item = create_item(self.user1)
        res  = self.client.delete(f'/api/v1/items/{item.pk}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Item.objects.count(), 0)

    def test_cannot_delete_others_item(self):
        item = create_item(self.user2)
        res  = self.client.delete(f'/api/v1/items/{item.pk}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Item.objects.count(), 1)

    def test_my_items(self):
        create_item(self.user1, name='Mine')
        create_item(self.user2, name='Theirs')
        res = self.client.get('/api/v1/items/mine/')
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Mine')

    def test_suggestions(self):
        # My item: 100000, their item: 95000 → ratio 1.05 → balanced
        create_item(self.user1, name='My Item',    value=100000)
        create_item(self.user2, name='Their Item', value=95000)
        res = self.client.get('/api/v1/items/suggestions/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['fairness'], 'balanced')

    def test_suggestions_exclude_unfair(self):
        # Ratio 100000 / 10000 = 10 → unfair, excluded
        create_item(self.user1, name='Expensive', value=100000)
        create_item(self.user2, name='Cheap',     value=10000)
        res = self.client.get('/api/v1/items/suggestions/')
        self.assertEqual(len(res.data), 0)


class ExchangeTestCase(TestCase):
    """Tests for /api/v1/exchanges/ endpoints."""

    def setUp(self):
        self.client   = APIClient()
        self.proposer = create_user(email='proposer@test.com', first_name='Proposer',
                                    contact='+237111')
        self.owner    = create_user(email='owner@test.com',    first_name='Owner',
                                    contact='+237222')
        self.my_item    = create_item(self.proposer, name='My Phone',   value=100000)
        self.their_item = create_item(self.owner,    name='Their Book', value=95000)
        self.client.force_authenticate(user=self.proposer)

    def test_propose_exchange(self):
        res = self.client.post('/api/v1/exchanges/', {
            'offeredItemId':   self.my_item.pk,
            'requestedItemId': self.their_item.pk,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['ok'])
        ex = res.data['exchange']
        self.assertEqual(ex['status'],   'pending')
        self.assertEqual(ex['fairness'], 'balanced')
        # Owner should get a notification
        self.assertEqual(Notification.objects.filter(user=self.owner).count(), 1)

    def test_cannot_swap_own_item(self):
        item2 = create_item(self.proposer, name='My Other Item', value=90000)
        res   = self.client.post('/api/v1/exchanges/', {
            'offeredItemId':   self.my_item.pk,
            'requestedItemId': item2.pk,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_exchange(self):
        ex = Exchange.objects.create(
            proposer=self.proposer, owner=self.owner,
            offered_item=self.my_item, requested_item=self.their_item,
            status='pending', fairness='balanced',
        )
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(f'/api/v1/exchanges/{ex.pk}/respond/',
                               {'accepted': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ex.refresh_from_db()
        self.assertEqual(ex.status, 'accepted')
        # Items should be marked unavailable
        self.my_item.refresh_from_db()
        self.their_item.refresh_from_db()
        self.assertFalse(self.my_item.available)
        self.assertFalse(self.their_item.available)
        # swap_count incremented
        self.proposer.refresh_from_db()
        self.owner.refresh_from_db()
        self.assertEqual(self.proposer.swap_count, 1)
        self.assertEqual(self.owner.swap_count, 1)
        # Both should have notifications
        self.assertEqual(Notification.objects.filter(user=self.proposer).count(), 1)
        self.assertEqual(Notification.objects.filter(user=self.owner).count(), 1)

    def test_reject_exchange(self):
        ex = Exchange.objects.create(
            proposer=self.proposer, owner=self.owner,
            offered_item=self.my_item, requested_item=self.their_item,
            status='pending', fairness='balanced',
        )
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(f'/api/v1/exchanges/{ex.pk}/respond/',
                               {'accepted': False}, format='json')
        ex.refresh_from_db()
        self.assertEqual(ex.status, 'rejected')
        # Items stay available
        self.my_item.refresh_from_db()
        self.assertTrue(self.my_item.available)

    def test_only_owner_can_respond(self):
        ex = Exchange.objects.create(
            proposer=self.proposer, owner=self.owner,
            offered_item=self.my_item, requested_item=self.their_item,
            status='pending', fairness='balanced',
        )
        # proposer tries to respond to own proposal
        res = self.client.post(f'/api/v1/exchanges/{ex.pk}/respond/',
                               {'accepted': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_fairness_unfair(self):
        cheap = create_item(self.owner, name='Cheap', value=10000)
        res   = self.client.post('/api/v1/exchanges/', {
            'offeredItemId':   self.my_item.pk,
            'requestedItemId': cheap.pk,
        }, format='json')
        self.assertEqual(res.data['exchange']['fairness'], 'unfair')


class ReviewTestCase(TestCase):
    """Tests for /api/v1/reviews/ endpoints."""

    def setUp(self):
        self.client  = APIClient()
        self.author  = create_user(email='author@test.com', first_name='Author')
        self.target  = create_user(email='target@test.com', first_name='Target')
        self.item_a  = create_item(self.author, value=50000)
        self.item_t  = create_item(self.target, value=55000)
        self.exchange = Exchange.objects.create(
            proposer=self.author, owner=self.target,
            offered_item=self.item_a, requested_item=self.item_t,
            status='accepted', fairness='balanced',
        )
        self.client.force_authenticate(user=self.author)

    def test_submit_review(self):
        res = self.client.post('/api/v1/reviews/', {
            'targetUserId': self.target.pk,
            'exchangeId':   self.exchange.pk,
            'stars':        5,
            'comment':      'Great swap!',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['ok'])
        # Target's stars and review_count updated
        self.target.refresh_from_db()
        self.assertEqual(self.target.stars,        5.0)
        self.assertEqual(self.target.review_count, 1)
        # Exchange marked as reviewed by proposer
        self.exchange.refresh_from_db()
        self.assertTrue(self.exchange.reviewed_by_proposer)
        # Notification sent to target
        self.assertEqual(Notification.objects.filter(user=self.target).count(), 1)

    def test_get_reviews_for_user(self):
        Review.objects.create(author=self.author, target_user=self.target,
                               stars=4, comment='Good')
        res = self.client.get(f'/api/v1/reviews/?userId={self.target.pk}')
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['stars'], 4)

    def test_star_average_recalculated(self):
        # Two reviews → avg should be (5+3)/2 = 4.0
        other = create_user(email='other@test.com', first_name='Other')
        Review.objects.create(author=other,       target_user=self.target, stars=5, comment='')
        Review.objects.create(author=self.author, target_user=self.target, stars=3, comment='')
        self.target.refresh_from_db()  # signal hasn't run; trigger via API
        res = self.client.post('/api/v1/reviews/', {
            'targetUserId': self.target.pk,
            'exchangeId':   None,
            'stars':        3,
            'comment':      'Ok',
        }, format='json')
        self.target.refresh_from_db()
        # 3 reviews total (2 existing + 1 new), avg = (5+3+3)/3 = 3.67 → rounded to 3.7
        self.assertAlmostEqual(self.target.stars, 3.7, places=1)


class NotificationTestCase(TestCase):
    """Tests for /api/v1/notifications/ endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user   = create_user(email='notif@test.com')
        self.client.force_authenticate(user=self.user)

    def _create_notif(self, msg='Test notification', type='proposal'):
        from apps.notifications.utils import push_notification
        push_notification(user_id=self.user.pk, type=type, message=msg)

    def test_list_notifications(self):
        self._create_notif('Notif 1')
        self._create_notif('Notif 2')
        res = self.client.get('/api/v1/notifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['notifications']), 2)
        self.assertEqual(res.data['unreadCount'], 2)

    def test_mark_one_read(self):
        self._create_notif()
        notif = Notification.objects.first()
        res   = self.client.post(f'/api/v1/notifications/{notif.pk}/read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.read)

    def test_mark_all_read(self):
        self._create_notif('N1')
        self._create_notif('N2')
        res = self.client.post('/api/v1/notifications/read-all/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        unread = Notification.objects.filter(user=self.user, read=False).count()
        self.assertEqual(unread, 0)
