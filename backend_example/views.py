import json
import datetime
import jwt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth.decorators import login_required
from .models import Client

@csrf_exempt
def login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        try:
            user = Client.objects.get(username=username)
            if user.password == password:  # En production, utilisez check_password()
                # Créer le payload JWT
                payload = {
                    'user_id': user.id,
                    'username': user.username,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),  # Expiration dans 1h
                    'iat': datetime.datetime.utcnow()
                }
                
                # Générer le token JWT
                token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
                
                return JsonResponse({
                    'token': token,
                    'message': 'Connexion réussie'
                }, status=200)
            else:
                return JsonResponse({
                    'message': 'Nom d\'utilisateur ou mot de passe incorrect'
                }, status=400)
        except Client.DoesNotExist:
            return JsonResponse({
                'message': 'Nom d\'utilisateur ou mot de passe incorrect'
            }, status=400)
    
    return JsonResponse({'message': 'Méthode non autorisée'}, status=405)

def verify_token(request):
    """Fonction utilitaire pour vérifier le token JWT"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, 'Token manquant ou format invalide'
    
    token = auth_header.split(' ')[1]
    
    try:
        # Décoder et vérifier le token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, 'Token expiré'
    except jwt.InvalidTokenError:
        return None, 'Token invalide'

@csrf_exempt
def client_info(request):
    if request.method == 'GET':
        # Vérifier le token
        payload, error = verify_token(request)
        
        if error:
            return JsonResponse({'error': error}, status=401)
        
        try:
            # Récupérer les informations du client
            client = Client.objects.get(id=payload['user_id'])
            
            return JsonResponse({
                'id': client.id,
                'nom': client.nom,
                'prenom': client.prenom,
                'email': client.email,
                'adresse': client.adresse,
                'telephone': client.telephone,
                'username': client.username
            }, status=200)
            
        except Client.DoesNotExist:
            return JsonResponse({'error': 'Client non trouvé'}, status=404)
    
    return JsonResponse({'message': 'Méthode non autorisée'}, status=405) 