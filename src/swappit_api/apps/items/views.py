"""
apps/items/views.py

Endpoints:
  GET  /api/v1/items/                → list all available items (Explorer)
  POST /api/v1/items/                → create item (MySpace addItem)
  GET  /api/v1/items/<id>/           → item detail (ItemDetail page)
  DELETE /api/v1/items/<id>/         → delete own item (MySpace deleteItem)
  GET  /api/v1/items/mine/           → my items only (MySpace tab)
  GET  /api/v1/items/suggestions/    → smart swap suggestions (Explorer)
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.db.models import Q

from .models import Item
from .serializers import ItemSerializer, ItemCreateSerializer


class ItemListCreateView(APIView):
    """
    GET  → Explorer: all available items, with search/category/sort query params.
            ?search=iphone  ?category=Electronics  ?sort=value_asc|value_desc|recent
    POST → addItem() from MySpace.jsx
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Item.objects.filter(available=True).select_related('user')

        # --- Search (matches AppContext filter logic) ---
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # --- Category ---
        category = request.query_params.get('category', 'All')
        if category and category != 'All':
            qs = qs.filter(category=category)

        # --- Sort ---
        sort = request.query_params.get('sort', 'recent')
        if sort == 'value_asc':
            qs = qs.order_by('value')
        elif sort == 'value_desc':
            qs = qs.order_by('-value')
        else:
            qs = qs.order_by('-created_at')

        serializer = ItemSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ItemCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'ok': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        item = serializer.save()
        return Response({'ok': True, 'item': ItemSerializer(item, context={'request': request}).data},
                        status=status.HTTP_201_CREATED)


class ItemDetailView(APIView):
    """
    GET    /api/v1/items/<id>/ → ItemDetail.jsx
    DELETE /api/v1/items/<id>/ → deleteItem() in MySpace.jsx (owner only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            item = Item.objects.select_related('user').get(pk=pk)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ItemSerializer(item, context={'request': request}).data)

    def delete(self, request, pk):
        try:
            item = Item.objects.get(pk=pk, user=request.user)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found or not yours.'},
                            status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response({'ok': True}, status=status.HTTP_204_NO_CONTENT)


class MyItemsView(APIView):
    """
    GET /api/v1/items/mine/
    Returns all items belonging to the authenticated user (any availability).
    Mirrors getMyItems() from AppContext.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Item.objects.filter(user=request.user).order_by('-created_at')
        return Response(ItemSerializer(items, many=True, context={'request': request}).data)


class SuggestionsView(APIView):
    """
    GET /api/v1/items/suggestions/

    Replicates getSuggestions() from AppContext.jsx:
      For each of the user's available items, find other users' items
      where the value ratio is between 0.72 and 1.39.
      Returns top 6 sorted by closest-to-1 ratio (most balanced).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        my_items    = Item.objects.filter(user=request.user, available=True)
        their_items = Item.objects.filter(available=True).exclude(user=request.user).select_related('user')

        suggestions = []
        for mine in my_items:
            for theirs in their_items:
                if theirs.value == 0:
                    continue
                ratio = mine.value / theirs.value
                if 0.72 <= ratio <= 1.39:
                    fairness = 'balanced'
                    if ratio < 0.92 or ratio > 1.08:
                        fairness = 'acceptable'
                    score = 1 - abs(1 - ratio)
                    suggestions.append({
                        'myItem':    ItemSerializer(mine,   context={'request': request}).data,
                        'theirItem': ItemSerializer(theirs, context={'request': request}).data,
                        'fairness':  fairness,
                        'score':     round(score, 4),
                    })

        suggestions.sort(key=lambda s: s['score'], reverse=True)
        return Response(suggestions[:6])
