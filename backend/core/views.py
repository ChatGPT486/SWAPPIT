from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, get_user_model
from .serializers import UserSerializer, ItemSerializer, SwapExchangeSerializer
from .models import Item, SwapExchange
from rest_framework.views import APIView
from django.db.models import Q

User = get_user_model()


# ==========================================
# 1. INSCRIPTION (SIGNUP)
# ==========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            "message": "Utilisateur créé avec succès !",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 2. CONNEXION (SIGNIN) — retourne user + tokens
# ==========================================
@api_view(['POST'])
@permission_classes([AllowAny])
def signin_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"error": "Veuillez fournir un nom d'utilisateur et un mot de passe."}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    if user is not None:
        # Génération des tokens JWT pour ce user
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        user_data['id'] = user.id  # Sécurité pare-feu

        return Response({
            "message": "Connexion réussie !",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_data
        }, status=status.HTTP_200_OK)

    return Response({"error": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED)


# ==========================================
# 3. LISTE ET CRÉATION DES ARTICLES
# ==========================================
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def item_list_create(request):
    if request.method == 'GET':
        items = Item.objects.filter(
            Q(image__startswith='http://') | Q(image__startswith='https://')
        ).order_by('-id')
        serializer = ItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        user_id = request.data.get('owner_id') or request.data.get('user')
        try:
            author = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        item = Item.objects.create(
            user=author,
            title=request.data.get('title'),
            description=request.data.get('description', ''),
            category=request.data.get('category', 'Other'),
            condition=request.data.get('condition', 'USED'),
            value=request.data.get('value', 0),
            emoji=request.data.get('emoji', '📦'),
            image=request.data.get('image') or None
        )
        serializer = ItemSerializer(item, context={'request': request})
        return Response({'message': 'Article créé avec succès !', 'item': serializer.data}, status=status.HTTP_201_CREATED)


# ==========================================
# 4. DÉTAIL D'UN ARTICLE
# ==========================================
@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
def item_detail_view(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response({"error": f"L'article {pk} n'existe pas."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ItemSerializer(item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        # Seul le propriétaire peut supprimer
        if request.user.is_authenticated and item.user == request.user:
            item.delete()
            return Response({"message": "Article supprimé."}, status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)


# ==========================================
# 5. MON ESPACE PERSONNEL
# ==========================================
class MySpaceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_products = Item.objects.filter(user=user).order_by('-id')
        products_serializer = ItemSerializer(user_products, many=True, context={'request': request})

        all_swaps = SwapExchange.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-id')
        swaps_pending = all_swaps.filter(status='pending')
        swaps_completed = all_swaps.filter(status__in=['accepted', 'rejected'])

        return Response({
            "user": UserSerializer(user).data,
            "items": products_serializer.data,
            "transactions_pending": SwapExchangeSerializer(swaps_pending, many=True).data,
            "transactions_completed": SwapExchangeSerializer(swaps_completed, many=True).data,
        })


# ==========================================
# 6. VITRINE PUBLIQUE
# ==========================================
@api_view(['GET'])
@permission_classes([AllowAny])
def get_items(request):
    items = Item.objects.filter(
        Q(image__startswith='http://') | Q(image__startswith='https://')
    ).order_by('-id')
    serializer = ItemSerializer(items, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# 7. SYSTÈME DE TROC — CRÉATION D'UNE PROPOSITION
# ==========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_swap(request):
    """
    Crée une nouvelle proposition de troc.
    Body attendu: { my_item: int, their_item: int, receiver: int }
    """
    sender = request.user
    my_item_id = request.data.get('my_item')
    their_item_id = request.data.get('their_item')
    receiver_id = request.data.get('receiver')

    # Validations
    if not all([my_item_id, their_item_id, receiver_id]):
        return Response({"error": "Champs manquants : my_item, their_item, receiver sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        my_item = Item.objects.get(pk=my_item_id, user=sender)
    except Item.DoesNotExist:
        return Response({"error": "Votre article introuvable ou ne vous appartient pas."}, status=status.HTTP_404_NOT_FOUND)

    try:
        their_item = Item.objects.get(pk=their_item_id)
    except Item.DoesNotExist:
        return Response({"error": "L'article cible est introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        receiver = User.objects.get(pk=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Destinataire introuvable."}, status=status.HTTP_404_NOT_FOUND)

    # Pas de troc avec soi-même
    if sender == receiver:
        return Response({"error": "Vous ne pouvez pas proposer un troc à vous-même."}, status=status.HTTP_400_BAD_REQUEST)

    # Éviter les doublons en attente
    existing = SwapExchange.objects.filter(
        sender=sender, my_item=my_item, their_item=their_item, status='pending'
    ).exists()
    if existing:
        return Response({"error": "Une proposition identique est déjà en attente."}, status=status.HTTP_400_BAD_REQUEST)

    # Calcul de la fairness automatique
    my_val = my_item.value or 0
    their_val = their_item.value or 0
    if my_val == 0 and their_val == 0:
        fairness = 'fair'
    elif my_val == 0 or their_val == 0:
        fairness = 'skewed'
    else:
        ratio = max(my_val, their_val) / min(my_val, their_val)
        if ratio <= 1.2:
            fairness = 'fair'
        elif ratio <= 2.0:
            fairness = 'skewed'
        else:
            fairness = 'unfair'

    swap = SwapExchange.objects.create(
        sender=sender,
        receiver=receiver,
        my_item=my_item,
        their_item=their_item,
        fairness=fairness,
        status='pending'
    )

    serializer = SwapExchangeSerializer(swap)
    return Response({
        "message": "Proposition de troc envoyée !",
        "swap": serializer.data
    }, status=status.HTTP_201_CREATED)


# ==========================================
# 8. SYSTÈME DE TROC — RÉPONDRE (ACCEPTER/REFUSER)
# ==========================================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def respond_swap(request, swap_id):
    """
    Le receiver accepte ou refuse une proposition.
    Body attendu: { action: 'accepted' | 'rejected' }
    """
    try:
        swap = SwapExchange.objects.get(pk=swap_id, receiver=request.user)
    except SwapExchange.DoesNotExist:
        return Response({"error": "Proposition introuvable ou vous n'êtes pas le destinataire."}, status=status.HTTP_404_NOT_FOUND)

    if swap.status != 'pending':
        return Response({"error": f"Cette proposition a déjà été traitée ({swap.status})."}, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action')
    if action not in ['accepted', 'rejected']:
        return Response({"error": "Action invalide. Utilisez 'accepted' ou 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

    swap.status = action
    swap.save()

    serializer = SwapExchangeSerializer(swap)
    msg = "Troc accepté ! Les contacts seront partagés." if action == 'accepted' else "Proposition refusée."
    return Response({"message": msg, "swap": serializer.data}, status=status.HTTP_200_OK)


# ==========================================
# 9. LISTE DES SWAPS (pour debugging)
# ==========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_swaps(request):
    user = request.user
    swaps = SwapExchange.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-created_at')
    serializer = SwapExchangeSerializer(swaps, many=True)
    return Response(serializer.data)
