"""
apps/exchanges/views.py

Endpoints:
  GET  /api/v1/exchanges/              → getMyExchanges()
  POST /api/v1/exchanges/              → proposeExchange()
  POST /api/v1/exchanges/<id>/respond/ → respondExchange()
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
from django.db.models import Q

from apps.items.models import Item
from apps.notifications.utils import push_notification

from .models import Exchange
from .serializers import ExchangeSerializer, ProposeExchangeSerializer, RespondExchangeSerializer

User = get_user_model()


class ExchangeListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Exchange.objects.filter(
            Q(proposer=request.user) | Q(owner=request.user)
        ).select_related(
            'proposer', 'owner',
            'offered_item', 'offered_item__user',
            'requested_item', 'requested_item__user',
        )
        return Response(ExchangeSerializer(qs, many=True).data)

    def post(self, request):
        ser = ProposeExchangeSerializer(data=request.data)
        if not ser.is_valid():
            return Response({'ok': False, 'errors': ser.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        offered_id   = ser.validated_data['offeredItemId']
        requested_id = ser.validated_data['requestedItemId']

        try:
            offered_item = Item.objects.get(pk=offered_id, user=request.user, available=True)
        except Item.DoesNotExist:
            return Response({'ok': False, 'error': 'Offered item not found or not available.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            requested_item = Item.objects.get(pk=requested_id, available=True)
        except Item.DoesNotExist:
            return Response({'ok': False, 'error': 'Requested item not found or not available.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if requested_item.user_id == request.user.pk:
            return Response({'ok': False, 'error': 'Cannot swap with your own item.'},
                            status=status.HTTP_400_BAD_REQUEST)

        fairness = Exchange.compute_fairness(offered_item.value, requested_item.value)

        exchange = Exchange.objects.create(
            proposer=request.user,
            owner=requested_item.user,
            offered_item=offered_item,
            requested_item=requested_item,
            status='pending',
            fairness=fairness,
        )

        push_notification(
            user_id=requested_item.user_id,
            type='proposal',
            exchange_id=exchange.pk,
            message=f'{request.user.first_name} wants to swap your "{requested_item.name}"',
        )

        return Response(
            {'ok': True, 'exchange': ExchangeSerializer(exchange).data},
            status=status.HTTP_201_CREATED
        )


class ExchangeRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            exchange = Exchange.objects.select_related(
                'proposer', 'owner', 'offered_item', 'requested_item'
            ).get(pk=pk, owner=request.user, status='pending')
        except Exchange.DoesNotExist:
            return Response({'ok': False, 'error': 'Exchange not found or already resolved.'},
                            status=status.HTTP_404_NOT_FOUND)

        ser = RespondExchangeSerializer(data=request.data)
        if not ser.is_valid():
            return Response({'ok': False, 'errors': ser.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        accepted = ser.validated_data['accepted']
        exchange.status = 'accepted' if accepted else 'rejected'
        exchange.save(update_fields=['status'])

        if accepted:
            Item.objects.filter(
                pk__in=[exchange.offered_item_id, exchange.requested_item_id]
            ).update(available=False)

            # Atomic increment via refresh
            proposer = User.objects.get(pk=exchange.proposer_id)
            owner    = User.objects.get(pk=exchange.owner_id)
            proposer.swap_count += 1
            proposer.save(update_fields=['swap_count'])
            owner.swap_count += 1
            owner.save(update_fields=['swap_count'])

            push_notification(
                user_id=exchange.proposer_id, type='accepted',
                exchange_id=exchange.pk,
                message=(f'{exchange.owner.first_name} accepted your swap! '
                         f'Contact: {exchange.owner.contact}'),
                contact=exchange.owner.contact,
            )
            push_notification(
                user_id=exchange.owner_id, type='accepted',
                exchange_id=exchange.pk,
                message=(f'Exchange confirmed with {exchange.proposer.first_name}. '
                         f'Contact: {exchange.proposer.contact}'),
                contact=exchange.proposer.contact,
            )
        else:
            push_notification(
                user_id=exchange.proposer_id, type='rejected',
                exchange_id=exchange.pk,
                message=(f'{exchange.owner.first_name} declined your swap proposal '
                         f'for "{exchange.requested_item.name}".'),
            )

        return Response({'ok': True, 'exchange': ExchangeSerializer(exchange).data})
