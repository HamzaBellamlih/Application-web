# Correction pour la vue login Django
# Remplace ta vue login actuelle par celle-ci :

import json
import datetime
import jwt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
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
                
                # IMPORTANT : Retourner le token dans la réponse
                return JsonResponse({
                    'token': token,  # ← Ajouter cette ligne
                    'message': 'Connexion réussie !'
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