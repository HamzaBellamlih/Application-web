import csv
from decimal import Decimal
from tkinter import Image
from django.http import HttpResponse, JsonResponse, Http404
from django.shortcuts import get_object_or_404, redirect
import numpy as np
import pytesseract
import cv2
import math
import datetime
from api.models import Client, Article, Mesure, Planche
from django.views.decorators.csrf import csrf_exempt
import json
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

@csrf_exempt
def hello(request):
    return JsonResponse({"message": "Bonjour depuis Django"})

@csrf_exempt
def inscription_client(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            champs = ['username', 'password', 'nom', 'prenom', 'email', 'adresse', 'telephone']
            for champ in champs:
                if champ not in data or not data[champ]:
                    return JsonResponse({'message': f'Le champ {champ} est requis.'}, status=400)

            username = data['username']

            # Vérifier unicité username et email
            if Client.objects.filter(username=username).exists():
                return JsonResponse({'message': 'Nom d’utilisateur déjà utilisé.'}, status=400)
            if Client.objects.filter(email=data['email']).exists():
                return JsonResponse({'message': 'Email déjà utilisé.'}, status=400)

            # 🔹 Créer le client
            client = Client.objects.create(
                username=username,
                password=data['password'],  # ⚠️ ici je conseille de hasher (voir ci-dessous)
                nom=data['nom'],
                prenom=data['prenom'],
                email=data['email'],
                adresse=data['adresse'],
                telephone=data['telephone']
            )

            # 🔹 Retourner l'ID du client
            return JsonResponse({
                'message': 'Inscription réussie !',
                'id': client.id
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'message': 'Données invalides.'}, status=400)
    else:
        return JsonResponse({'message': 'Méthode non autorisée.'}, status=405)

@csrf_exempt
def login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        try:
            user = Client.objects.get(username=username)
            if user.password == password:
                # Créer le payload JWT
                payload = {
                    'user_id': user.id,
                    'username': user.username,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),  # Expiration dans 1h
                    'iat': datetime.datetime.utcnow()
                }
                
                # Générer le token JWT
                token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
                
                # Retourner le token ET le message de succès
                return JsonResponse({
                    'token': token,
                    'message': 'Connexion réussie !'
                }, status=200)
            else:
                return JsonResponse({'message': 'Nom d’utilisateur ou mot de passe incorrect'}, status=400)
        except Client.DoesNotExist:
            return JsonResponse({'message': 'Nom d’utilisateur ou mot de passe incorrect'}, status=400)
    return JsonResponse({'message': 'Méthode non autorisée'}, status=405)

@csrf_exempt
def liste_clients(request):
    if request.method == 'GET':
        clients = Client.objects.all().values(
            'id','username', 'nom', 'prenom', 'email', 'adresse', 'telephone'
        )
        return JsonResponse(list(clients), safe=False)
    else:
        return JsonResponse({'message': 'Méthode non autorisée.'}, status=405)

@csrf_exempt
def get_client_par_username(request):
    if request.method == 'GET':
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Token manquant ou invalide'}, status=401)

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            username = payload.get('username')

            if not username:
                return JsonResponse({'error': 'Username manquant dans le token'}, status=400)

            try:
                client = Client.objects.get(username=username)
                return JsonResponse({
                    'username': client.username,
                    'nom': client.nom,
                    'prenom': client.prenom,
                    'email': client.email,
                    'adresse': client.adresse,
                    'telephone': client.telephone,
                })
            except Client.DoesNotExist:
                return JsonResponse({'error': 'Client non trouvé'}, status=404)

        except ExpiredSignatureError:
            return JsonResponse({'error': 'Token expiré'}, status=401)
        except InvalidTokenError:
            return JsonResponse({'error': 'Token invalide'}, status=401)

    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

def statistiques_articles(request):
    if request.method == 'GET':
        articles = Article.objects.all()
        articles_data = []
        total_general = 0
        for article in articles:
            prix_payer_total = 0
            for m in article.mesures.all():
                prix_payer_total += float(m.longueur or 0) * float(m.largeur or 0) * float(m.nombre_de_fois or 0) * 0.5
            articles_data.append({
                "id": article.id,
                "type": article.type,
                "prix_payer_total": prix_payer_total,
            })
            total_general += prix_payer_total

        data = {
            "nombre_articles": articles.count(),
            "total_general": total_general,
            "articles": articles_data
        }
        return JsonResponse(data, status=200)
    else:
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

def liste_articles(request):
    if request.method == 'GET':
        articles = Article.objects.all()
        articles_list = []

        for article in articles:
            articles_list.append({
                "id": article.id,
                "type": article.type,
                "date": str(article.date),
                "description": article.description if hasattr(article, "description") else "",
            })

        return JsonResponse({"articles": articles_list}, status=200)
    else:
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

@csrf_exempt
def supprimer_article_client(request, article_id):
    if request.method != "POST":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({"message": "Token d'authentification manquant."}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username = payload.get('username')
        if not username:
            return JsonResponse({"message": "Token invalide."}, status=401)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"message": "Token expiré."}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"message": "Token invalide."}, status=401)

    try:
        client = Client.objects.get(username=username)
        article = Article.objects.get(id=article_id)
    except Article.DoesNotExist:
        return JsonResponse({"message": "Article introuvable."}, status=404)
    
    article.delete()
    return JsonResponse({"message": "Article supprimé avec succès."}, status=200)

@csrf_exempt
def supprimer_mesure_client(request, mesure_id):
    try:
        mesure = Mesure.objects.get(id=mesure_id)
    except Mesure.DoesNotExist:
        return JsonResponse({'message': 'Mesure introuvable.'}, status=404)

    if request.method == "DELETE":
        mesure.delete()
        return JsonResponse({'message': 'Mesure supprimée avec succès.'}, status=200)
    else:
        return JsonResponse({'message': 'Méthode non autorisée.'}, status=405)

@csrf_exempt
def modifier_article_client(request, article_id):
    if request.method != "PUT":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    try:
        article = Article.objects.get(id=article_id)
    except Article.DoesNotExist:
        return JsonResponse({"message": "Article introuvable."}, status=404)

    data = json.loads(request.body)
    nom = data.get("nom")
    epaisseur = data.get("epaisseur")
    planche_nom = data.get("planche_nom")
    planche_longueur = data.get("planche_longueur")
    planche_largeur = data.get("planche_largeur")

    # Vérification et mise à jour de l'atelier
    if nom in dict(article._meta.get_field("nom").choices):
        article.type = nom

    try:
        article.epaisseur = Decimal(epaisseur)
    except (ValueError, TypeError):
        return JsonResponse({"message": "Épaisseur invalide."}, status=400)

    article.save()

    # Mise à jour ou création de la planche liée
    planche = article.planches.first()
    if planche:
        if planche_nom:
            planche.nom = planche_nom
        if planche_longueur:
            planche.longueur_initiale_mm = int(float(planche_longueur) * 10)
        if planche_largeur:
            planche.largeur_initiale_mm = int(float(planche_largeur) * 10)
        planche.save()
    else:
        if planche_longueur and planche_largeur:
            Planche.objects.create(
                article=article,
                nom=planche_nom or f"Planche de {article.type}",
                longueur_initiale_mm=int(float(planche_longueur) * 10),
                largeur_initiale_mm=int(float(planche_largeur) * 10),
            )

    return JsonResponse({"message": "Atelier modifié avec succès."}, status=200)

@csrf_exempt
def modifier_mesure_client(request, mesure_id):
    if request.method != "PUT":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    try:
        mesure = Mesure.objects.get(id=mesure_id)
    except Mesure.DoesNotExist:
        return JsonResponse({"message": "Mesure introuvable."}, status=404)

    data = json.loads(request.body)
    longueur = data.get("longueur")
    largeur = data.get("largeur")
    nombre_de_fois = data.get("nombre_de_fois")
    encadrement_droite = data.get("encadrement_droite", False)
    encadrement_gauche = data.get("encadrement_gauche", False)
    encadrement_haut = data.get("encadrement_haut", False)
    encadrement_bas = data.get("encadrement_bas", False)

    if not longueur or not largeur or not nombre_de_fois:
        return JsonResponse({"message": "Tous les champs sont requis."}, status=400)

    mesure.longueur = longueur
    mesure.largeur = largeur
    mesure.nombre_de_fois = nombre_de_fois
    mesure.encadrement_droite = encadrement_droite
    mesure.encadrement_gauche = encadrement_gauche
    mesure.encadrement_haut = encadrement_haut
    mesure.encadrement_bas = encadrement_bas
    mesure.save()

    return JsonResponse({"message": "Mesure modifiée avec succès."}, status=200)

@csrf_exempt
def statistiques_articles_client(request):
    client_id = request.GET.get("id")
    if not client_id:
        return JsonResponse({"message": "ID client requis."}, status=400)
    
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return JsonResponse({"message": "Client non trouvé."}, status=404)

    articles = Article.objects.filter(client=client)
    articles_data = []
    total_general = 0

    for article in articles:
        prix_payer_total = 0
        for m in article.mesures.all():
            prix_payer_total += float(m.longueur or 0) * float(m.largeur or 0) * float(m.nombre_de_fois or 0) * 0.5
        articles_data.append({
            "id": article.id,
            "nom": getattr(article, "nom", ""),
            "prix_payer_total": prix_payer_total,
        })
        total_general += prix_payer_total

    data = {
        "client": {
            "id": client.id,
            "nom": getattr(client, "nom", ""),
            "prenom": getattr(client, "prenom", ""),
            "email": getattr(client, "email", ""),
        },
        "nombre_articles": articles.count(),
        "total_general": total_general,
        "articles": articles_data,
    }
    return JsonResponse(data, status=200)

@csrf_exempt
def ajouter_client_client(request):
    if request.method != "POST":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Données JSON invalides."}, status=400)

    nom = data.get("nom")
    prenom = data.get("prenom")
    age = data.get("age")
    email = data.get("email")
    telephone = data.get("telephone")

    if Client.objects.filter(email=email).exists():
        return JsonResponse({"message": "Cet email est déjà utilisé."}, status=400)

    client = Client.objects.create(
        nom=nom,
        prenom=prenom,
        age=age,
        email=email,
        telephone=telephone
    )

    # Si tu veux stocker l'id dans la session :
    request.session['dernier_client_id'] = client.id

    return JsonResponse({
        "message": "Client ajouté avec succès.",
        "client_id": client.id
    }, status=201)

@csrf_exempt
def ajouter_client(request):
    if request.method != "POST":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Données JSON invalides."}, status=400)

    nom = data.get("nom")
    prenom = data.get("prenom")
    email = data.get("email")
    telephone = data.get("telephone")
    adresse= data.get("adresse")

    if Client.objects.filter(email=email).exists():
        return JsonResponse({"message": "Cet email est déjà utilisé."}, status=400)

    client = Client.objects.create(
        nom=nom,
        prenom=prenom,
        email=email,
        telephone=telephone,
        adresse=adresse
    )

    request.session['dernier_client_id'] = client.id

    return JsonResponse({
        "message": "Client ajouté avec succès.",
        "client_id": client.id
    }, status=201)

@csrf_exempt
def ajouter_article_client(request):
    if request.method != "POST":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    # Vérifier l'authentification via le token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({"message": "Token d'authentification manquant."}, status=401)
    
    auth_parts = auth_header.split(' ')
    token = auth_parts[1] 
    
    try:
        # Décoder le token JWT pour vérifier l'authentification
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username = payload.get('username')
        
        if not username:
            return JsonResponse({"message": "Token invalide."}, status=401)
            
    except jwt.ExpiredSignatureError:
        return JsonResponse({"message": "Token expiré."}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"message": "Token invalide."}, status=401)
    
    # Charger les données JSON
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"message": "Format JSON invalide."}, status=400)

    # Récupérer le client depuis les données
    client_username = data.get("client_username")
    if not client_username:
        return JsonResponse({"message": "Username du client manquant."}, status=400)
    
    # Vérifier que le token correspond au client
    if client_username != username:
        return JsonResponse({"message": "Token ne correspond pas au client."}, status=401)
    
    try:
        client = Client.objects.get(username=client_username)
    except Client.DoesNotExist:
        return JsonResponse({"message": "Client introuvable."}, status=404)

    try:
        # Création de l'article
        article = Article.objects.create(
            client=client,
            nom=data.get("nom"),
            type=data.get("type"),
            epaisseur=data.get("epaisseur"),
            valide=False
        )
        
        # Planche associée
        planche_data = data.get("planche")
        Planche.objects.create(
            article=article,
            longueur_initiale_mm=planche_data.get("longueur_initiale_mm"),
            largeur_initiale_mm=planche_data.get("largeur_initiale_mm"),
            )
        
        # Mesures
        nb_mesures = int(data.get("nb_mesures", 0))
        for i in range(nb_mesures):
            m = data.get(f"mesure_{i}", {})
            Mesure.objects.create(
                article=article,
                longueur=m.get("longueur"),
                largeur=m.get("largeur"),
                nombre_de_fois=m.get("nombre_de_fois"),
                encadrement_droite=m.get("encadrement_droite", False),
                encadrement_gauche=m.get("encadrement_gauche", False),
                encadrement_haut=m.get("encadrement_haut", False),
                encadrement_bas=m.get("encadrement_bas", False),
            )

        return JsonResponse({"message": "Article enregistré avec succès.", "article_id": article.id}, status=201)

    except Exception as e:
        return JsonResponse({"message": f"Erreur lors de la création de l'article : {str(e)}"}, status=500)

@csrf_exempt
def liste_articles_client(request):
    if request.method != "GET":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    # Vérification du token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JsonResponse({"message": "Token d'authentification manquant."}, status=401)

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username = payload.get("username")
        if not username:
            return JsonResponse({"message": "Token invalide."}, status=401)
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token expiré"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Token invalide"}, status=401)

    # Vérification du client
    try:
        client = Client.objects.get(username=username)  # ⚠️ Vérifie bien que Client a un champ `username`
    except Client.DoesNotExist:
        return JsonResponse({"message": "Client introuvable."}, status=404)

    # Récupération des articles du client
    articles = Article.objects.filter(client=client)

    data = []
    for article in articles:
        # Planche associée
        planche_data = None
        if hasattr(article, "planches") and article.planches.exists():
            planche_obj = article.planches.first()
            planche_data = {
                "longueur_initiale_mm": getattr(planche_obj, "longueur_initiale_mm", None),
                "largeur_initiale_mm": getattr(planche_obj, "largeur_initiale_mm", None),
            }

        # Mesures associées
        mesures_list = [
            {
                "longueur": m.longueur,
                "largeur": m.largeur,
                "nombre_de_fois": m.nombre_de_fois,
                "encadrement_droite": m.encadrement_droite,
                "encadrement_gauche": m.encadrement_gauche,
                "encadrement_haut": m.encadrement_haut,
                "encadrement_bas": m.encadrement_bas,
            }
            for m in getattr(article, "mesures").all()
        ] if hasattr(article, "mesures") else []

        # Ajout dans la réponse
        data.append({
            "id": article.id,
            "nom": article.nom,
            "planche": planche_data,
            "type": article.type,
            "epaisseur": str(article.epaisseur),
            "date_creation": article.date_creation.strftime("%Y-%m-%d %H:%M") if article.date_creation else "",
            "date_modification": article.date_modification.strftime("%Y-%m-%d %H:%M") if article.date_modification else "",
            "mesures": mesures_list,
        })

    return JsonResponse(data, safe=False, status=200)

@csrf_exempt
def modifier_client(request, client_id):
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return JsonResponse({"success": False, "message": "Client introuvable"}, status=404)

    if request.method == "PUT":
        try:
            data = json.loads(request.body)

            client.nom = data.get("nom", client.nom)
            client.prenom = data.get("prenom", client.prenom)
            client.email = data.get("email", client.email)
            client.telephone = data.get("telephone", client.telephone)
            client.adresse = data.get("adresse", client.adresse)

            client.save()
            return JsonResponse({"success": True, "message": "Client modifié avec succès"})
        except Exception as e:
            return JsonResponse({"success": False, "message": f"Erreur : {str(e)}"}, status=400)

    return JsonResponse({"success": False, "message": "Méthode non autorisée"}, status=405)

@csrf_exempt
def supprimer_client(request, client_id):
    client = get_object_or_404(Client, id=client_id)

    if request.method == "DELETE":
        client.delete()
        return JsonResponse({"success": True, "message": "Client supprimé avec succès."})
    
    return JsonResponse({"success": False, "message": "Méthode non autorisée"}, status=405)

def liste_articles_clients(request):
    if request.method != "GET":
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    clients = Client.objects.all()
    data = []

    # Totaux globaux
    total_prix_total = 0.0
    total_prix_restant = 0.0

    for client in clients:
        articles_data = []
        client_total = 0.0
        client_restant = 0.0

        for article in client.article_set.all():  # relation Client -> Article (clé étrangère)
            prix_total = float(article.prix_total or 0.0)
            prix_restant = float(article.prix_restant or 0.0)

            articles_data.append({
                "id": article.id,
                "nom": article.nom,
                "type": article.type,
                "epaisseur": str(article.epaisseur),
                "date_creation": article.date_creation.strftime("%Y-%m-%d %H:%M:%S") if article.date_creation else None,
                "prix_total": prix_total,
                "prix_restant": prix_restant,
            })

            # Ajout aux sous-totaux
            client_total += prix_total
            client_restant += prix_restant

        # Ajout des totaux client → données
        data.append({
            "client": {
                "id": client.id,
                "nom": client.nom,
                "prenom": client.prenom,
                "email": client.email,
                "telephone": getattr(client, "telephone", ""),
            },
            "articles": articles_data,
            "total_client": client_total,
            "restant_client": client_restant,
        })

        # Ajout aux totaux globaux
        total_prix_total += client_total
        total_prix_restant += client_restant

    return JsonResponse({
        "clients": data,
        "totaux": {
            "prix_total_global": total_prix_total,
            "prix_restant_global": total_prix_restant,
        }
    }, safe=False, status=200)

@csrf_exempt
def liste_articles_valideur(request):
    if request.method != "GET":
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    clients = Client.objects.all()
    data = []

    for client in clients:
        articles_data = []

        for article in client.article_set.all():
            # Mesures
            mesures_data = []
            for mesure in article.mesures.all():
                mesures_data.append({
                    "id": mesure.id,
                    "longueur": float(mesure.longueur),
                    "largeur": float(mesure.largeur),
                    "nombre_de_fois": mesure.nombre_de_fois,
                    "encadrement": {
                        "droite": mesure.encadrement_droite,
                        "gauche": mesure.encadrement_gauche,
                        "haut": mesure.encadrement_haut,
                        "bas": mesure.encadrement_bas,
                    }
                })

            # Planches et leurs pièces
            planches_data = []
            for planche in article.planches.all():
                planches_data.append({
                    "longueur_initiale_mm": planche.longueur_initiale_mm,
                    "largeur_initiale_mm": planche.largeur_initiale_mm,
                })

            # Article
            articles_data.append({
                "id": article.id,
                "nom": article.nom,
                "date_creation": article.date_creation.strftime("%Y-%m-%d %H:%M:%S"),
                "date_modification": article.date_modification.strftime("%Y-%m-%d %H:%M:%S"),
                "mesures": mesures_data,
                "planches": planches_data,
            })

        # Client
        data.append({
            "client": {
                "id": client.id,
                "username": client.username,
                "nom": client.nom,
                "prenom": client.prenom,
                "email": client.email,
                "telephone": client.telephone,
                "adresse": client.adresse,
            },
            "articles": articles_data,
        })

    return JsonResponse({"clients": data}, safe=False, status=200)

@csrf_exempt
def liste_article_valideur(request, article_id):
    try:
        article = Article.objects.get(id=article_id)
    except Article.DoesNotExist:
        return JsonResponse({"message": "Article introuvable"}, status=404)

    if request.method == "GET":
        default_longueur = article.longueur or 200
        default_largeur = article.largeur or 250

        # 🔹 Vérifie bien que tu as un related_name sur ton modèle
        mesures = []
        for m in article.mesure_set.all():  # ou article.mesures.all() si tu as related_name="mesures"
            mesures.append({
                "longueur": m.longueur,
                "largeur": m.largeur,
                "nombre_de_fois": m.nombre_de_fois,
            })

        return JsonResponse({
            "article": {
                "id": article.id,
                "nom": article.type,
                "epaisseur": article.epaisseur,
                "mesures": mesures,   # ✅ on envoie la liste des mesures
            },
            "board_length": default_longueur,
            "board_width": default_largeur,
        })

@csrf_exempt
def liste_articles_valideur(request):
    if request.method != "GET":
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    clients = Client.objects.all()
    clients_data = []

    for client in clients:
        articles_data = []
        clients_data.append({
            "id": client.id,
            "prenom": client.prenom,
            "nom": client.nom,
        })
        for article in client.article_set.all():  # ✅ articles liés au client

            # Récupérer les mesures liées
            mesures_data = []
            for mesure in article.mesures.all():
                mesures_data.append({
                    "id": mesure.id,
                    "longueur": float(mesure.longueur),
                    "largeur": float(mesure.largeur),
                    "nombre_de_fois": mesure.nombre_de_fois,
                    "encadrement_droite": mesure.encadrement_droite,
                    "encadrement_gauche": mesure.encadrement_gauche,
                    "encadrement_haut": mesure.encadrement_haut,
                    "encadrement_bas": mesure.encadrement_bas,
                })

            # Récupérer la première planche si dispo
            planche = article.planches.first()
            planche_data = None
            if planche:
                planche_data = {
                    "longueur_initiale_mm": float(planche.longueur_initiale_mm),
                    "largeur_initiale_mm": float(planche.largeur_initiale_mm),
                }
                
            # Construire l'article
            articles_data.append({
                "id": article.id,
                "nom": article.nom,
                "epaisseur": float(article.epaisseur),
                "date_creation": article.date_creation.strftime("%d/%m/%Y, %H:%M") if article.date_creation else None,
                "valide": article.valide,
                "mesures": mesures_data,
                "planches": [planche_data] if planche_data else [],
            })

        clients_data.append({
            "id": client.id,
            "prenom": client.prenom,
            "nom": client.nom,
            "articles": articles_data,
        })

    return JsonResponse({"clients": clients_data}, safe=False)

@csrf_exempt
def ajouter_article(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            nom = data.get("nom")
            epaisseur = data.get("epaisseur")
            client_id = data.get("client_id") or request.session.get("dernier_client_id")
            client = Client.objects.get(id=client_id) if client_id else None
            nb_mesures = int(data.get("nb_mesures", 1))

            # Création de l'atelier
            article = Article.objects.create(nom=nom, epaisseur=epaisseur, client=client)

            # Planche associée
            planche_nom = data.get("planche_nom") or f"Planche de {nom}"
            planche_longueur = data.get("planche_longueur")
            planche_largeur = data.get("planche_largeur")
            if planche_longueur and planche_largeur:
                Planche.objects.create(
                    article=article,
                    nom=planche_nom,
                    longueur_initiale_mm=int(float(planche_longueur) * 10),
                    largeur_initiale_mm=int(float(planche_largeur) * 10),
                )

            # Mesures
            for i in range(nb_mesures):
                longueur = data.get(f"longueur_{i}")
                largeur = data.get(f"largeur_{i}")
                nombre_de_fois = data.get(f"nombre_de_fois_{i}")
                encadrement_droite = data.get(f"encadrement_droite_{i}", False)
                encadrement_gauche = data.get(f"encadrement_gauche_{i}", False)
                encadrement_haut = data.get(f"encadrement_haut_{i}", False)
                encadrement_bas = data.get(f"encadrement_bas_{i}", False)
                if longueur and largeur and nombre_de_fois:
                    Mesure.objects.create(
                        article=article,
                        longueur=longueur,
                        largeur=largeur,
                        nombre_de_fois=nombre_de_fois,
                        encadrement_droite=encadrement_droite,
                        encadrement_gauche=encadrement_gauche,
                        encadrement_haut=encadrement_haut,
                        encadrement_bas=encadrement_bas,
                    )

            if 'dernier_client_id' in request.session:
                del request.session['dernier_client_id']

            return JsonResponse({"success": True, "message": "Article ajouté avec succès", "article_id": article.id})

        except Client.DoesNotExist:
            return JsonResponse({"success": False, "message": "Client introuvable."}, status=404)
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=400)

    return JsonResponse({"success": False, "message": "Méthode non autorisée"}, status=405)

@csrf_exempt
def modifier_article(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    planche = article.planches.first()

    if request.method in ["POST", "PUT"]:  # ✅ On accepte PUT ou POST
        try:
            data = json.loads(request.body)

            nom = data.get("nom")
            type_bois = data.get("type")
            epaisseur = data.get("epaisseur")
            longueur_cm = data.get("longueur_initiale_mm")
            largeur_cm = data.get("largeur_initiale_mm")

            # ✅ Mise à jour article
            if nom:
                article.nom = nom
            if type_bois:
                article.type = type_bois
            if epaisseur:
                article.epaisseur = Decimal(epaisseur)

            article.save()

            # ✅ Mise à jour ou création planche
            if planche:
                if longueur_cm:
                    planche.longueur_initiale_mm = int(float(longueur_cm) * 10)
                if largeur_cm:
                    planche.largeur_initiale_mm = int(float(largeur_cm) * 10)
                planche.save()
            else:
                if longueur_cm and largeur_cm:
                    Planche.objects.create(
                        article=article,
                        longueur_initiale_mm=int(float(longueur_cm) * 10),
                        largeur_initiale_mm=int(float(largeur_cm) * 10),
                    )

            return JsonResponse({"success": True, "message": "Article modifié avec succès."})

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)

    return JsonResponse({"success": False, "message": "Méthode non autorisée."}, status=405)

@csrf_exempt
def supprimer_article(request, article_id):
    article = get_object_or_404(Article, id=article_id)

    if request.method == "DELETE":
        article.delete()
        return JsonResponse({"success": True, "message": "Article supprimé avec succès."}, status=200)

    return JsonResponse({"success": False, "message": "Méthode non autorisée. Utilisez DELETE."}, status=405)

@csrf_exempt
def modifier_mesure(request, mesure_id):
    mesure = get_object_or_404(Mesure, id=mesure_id)

    if request.method == "POST":
        data = json.loads(request.body)

        mesure.longueur = data.get("longueur", mesure.longueur)
        mesure.largeur = data.get("largeur", mesure.largeur)
        mesure.nombre_de_fois = data.get("nombre_de_fois", mesure.nombre_de_fois)
        mesure.encadrement_droite = data.get("encadrement_droite", False)
        mesure.encadrement_gauche = data.get("encadrement_gauche", False)
        mesure.encadrement_haut = data.get("encadrement_haut", False)
        mesure.encadrement_bas = data.get("encadrement_bas", False)
        mesure.save()

        session_key = f"prix_payer_restant_{mesure.article.id}"
        if session_key in request.session:
            del request.session[session_key]

        return JsonResponse({
            "success": True,
            "message": "Mesure modifiée avec succès. Le prix_payer total a été recalculé."
        }, status=200)

    return JsonResponse({"success": False, "message": "Méthode non autorisée. Utilisez POST."}, status=405)

@csrf_exempt
def liste_mesures_article(request, article_id):
    try:
        article = Article.objects.get(id=article_id)
    except Article.DoesNotExist:
        raise Http404("Article non trouvé")

    mesures = article.mesures.all().values(
        "id", "longueur", "largeur", "nombre_de_fois",
        "encadrement_droite", "encadrement_gauche", "encadrement_haut", "encadrement_bas"
    )
    return JsonResponse(list(mesures), safe=False)

@csrf_exempt
def supprimer_mesure(request, mesure_id):
    if request.method != "DELETE":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        mesure = get_object_or_404(Mesure, id=mesure_id)
        article = mesure.article

        # Supprimer la mesure
        mesure.delete()

        # Si article.prix_payer_total n'existe pas, ignorer la mise à jour du prix_payer
        if hasattr(article, "prix_payer_total"):
            try:
                longueur = Decimal(mesure.longueur or 0)
                largeur = Decimal(mesure.largeur or 0)
                nb_fois = Decimal(mesure.nombre_de_fois or 0)
                prix_payer_mesure = longueur * largeur * nb_fois * Decimal("0.5")
                article.prix_payer_total = Decimal(getattr(article, "prix_payer_total", 0) or 0) - prix_payer_mesure
                if article.prix_payer_total < 0:
                    article.prix_payer_total = Decimal("0.0")
                article.save()
            except Exception:
                pass

        return JsonResponse({
            "success": True,
            "message": "Mesure supprimée avec succès.",
            "mesure_id_supprimee": mesure_id
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# 🔹 Export CSV
def exporter_articles_csv(request, article_id):
    if request.method == "GET":
        if article_id:
            articles = [get_object_or_404(Article.objects.prefetch_related('mesures'), id=article_id)]
            filename = f"article_{article_id}.csv"
        else:
            articles = Article.objects.all().prefetch_related('mesures')
            filename = "articles.csv"

        response = HttpResponse(content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        # Construction du texte
        contenu = []

        for art in articles:
            lignes = []
            total = Decimal("0.0")

            # Header de l'article
            header1 = (
                "Article | Épaisseur (cm) | Longueur planche (cm) | Largeur planche (cm) | Mesures :"
            )
            lignes.append(header1)
            
            lignes.append(
                f"{getattr(art, 'type', '')} | "
                f"{getattr(art, 'epaisseur', '')}"
            )
            if art.planches.exists():
                for planche in art.planches.all():
                    longueur_cm = planche.longueur_initiale_mm / 10
                    largeur_cm = planche.largeur_initiale_mm / 10
                    lignes.append(
                        f"Planche: {longueur_cm} × {largeur_cm} cm"
                    )
            else:
                lignes.append("Planche: N/A")

            # Sous-header pour les mesures
            header2 = (
                "Longueur (cm) | Largeur (cm) | "
                "Nombre de fois | droite | gauche | haut | bas | prix_payer (DH)"
            )
            lignes.append(header2)

            # Parcours des mesures
            mesures = art.mesures.all()
            if mesures.exists():
                for mesure in mesures:
                    prix_payer = (
                        Decimal(str(mesure.longueur or 0)) *
                        Decimal(str(mesure.largeur or 0)) *
                        Decimal(str(mesure.nombre_de_fois or 0)) *
                        Decimal("1.5")
                    )
                    total += prix_payer
                    ligne = (
                        f"{getattr(mesure, 'longueur', '')} | "
                        f"{getattr(mesure, 'largeur', '')} | "
                        f"{getattr(mesure, 'nombre_de_fois', '')} | "
                        f"{getattr(mesure, 'encadrement_droite', '')} | "
                        f"{getattr(mesure, 'encadrement_gauche', '')} | "
                        f"{getattr(mesure, 'encadrement_haut', '')} | "
                        f"{getattr(mesure, 'encadrement_bas', '')} | "
                        f"{prix_payer:.2f} DH"
                    )
                    lignes.append(ligne)
            else:
                lignes.append(" | | | | | | |")

            # Prix total pour l'article
            lignes.append(f"Prix total : {total:.2f} DH")
            lignes.append("\n")  # séparation entre articles

            contenu.append("\n".join(lignes))

        # Écriture finale
        response.write("\n\n".join(contenu))
        return response

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

# 🔹 Export TXT
def exporter_articles_text(request, article_id=None):
    if request.method == "GET":
        if article_id:
            articles = [get_object_or_404(Article.objects.prefetch_related('mesures'), pk=article_id)]
            filename = f"article_{article_id}.txt"
        else:
            articles = Article.objects.all().prefetch_related('mesures')
            filename = "articles.txt"

        response = HttpResponse(content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        # Construction du texte
        contenu = []

        for art in articles:
            lignes = []
            total = Decimal("0.0")

            # Header de l'article
            header1 = (
                "Article | Épaisseur (cm) | Longueur planche (cm) | Largeur planche (cm) | Mesures :"
            )
            lignes.append(header1)
            lignes.append(
                f"{getattr(art, 'type', '')} | "
                f"{getattr(art, 'epaisseur', '')}"
            )
            if art.planches.exists():
                for planche in art.planches.all():
                    longueur_cm = planche.longueur_initiale_mm / 10
                    largeur_cm = planche.largeur_initiale_mm / 10
                    lignes.append(
                        f"Planche: {longueur_cm} × {largeur_cm} cm"
                    )
            else:
                lignes.append("Planche: N/A")

            # Sous-header pour les mesures
            header2 = (
                "Longueur (cm) | Largeur (cm) | "
                "Nombre de fois | droite | gauche | haut | bas | prix_payer (DH)"
            )
            lignes.append(header2)

            # Parcours des mesures
            mesures = art.mesures.all()
            if mesures.exists():
                for mesure in mesures:
                    prix_payer = (
                        Decimal(str(mesure.longueur or 0)) *
                        Decimal(str(mesure.largeur or 0)) *
                        Decimal(str(mesure.nombre_de_fois or 0)) *
                        Decimal("1.5")
                    )
                    total += prix_payer
                    ligne = (
                        f"{getattr(mesure, 'longueur', '')} | "
                        f"{getattr(mesure, 'largeur', '')} | "
                        f"{getattr(mesure, 'nombre_de_fois', '')} | "
                        f"{getattr(mesure, 'encadrement_droite', '')} | "
                        f"{getattr(mesure, 'encadrement_gauche', '')} | "
                        f"{getattr(mesure, 'encadrement_haut', '')} | "
                        f"{getattr(mesure, 'encadrement_bas', '')} | "
                        f"{prix_payer:.2f} DH"
                    )
                    lignes.append(ligne)
            else:
                lignes.append(" | | | | | | |")

            # Prix total pour l'article
            lignes.append(f"Prix total : {total:.2f} DH")
            lignes.append("\n")  # séparation entre articles

            contenu.append("\n".join(lignes))

        # Écriture finale
        response.write("\n\n".join(contenu))
        return response

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

@csrf_exempt
def prix_planche(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    
    # 🔹 Calcul du nouveau prix total depuis les planches
    total = Decimal("0.0")
    for planche in article.planches.all():
        longueur = Decimal(planche.longueur_initiale_mm or 0) / Decimal("10")  # Convertir mm en cm
        largeur = Decimal(planche.largeur_initiale_mm or 0) / Decimal("10")
        total += longueur * largeur * Decimal("0.25")  # Coefficient de prix par cm²

    # 🔹 Calcul propre du prix restant
    ancien_total = article.prix_total or Decimal("0.0")
    ancien_restant = article.prix_restant or Decimal("0.0")

    article.prix_total = total

    # ✅ Si aucun paiement n'a été enregistré, le restant = total
    if ancien_total == 0 or ancien_restant == ancien_total:
        article.prix_restant = total
    else:
        # ✅ Si une partie a été payée, on conserve la même somme déjà payée
        montant_paye = ancien_total - ancien_restant
        nouveau_restant = total - montant_paye
        article.prix_restant = max(Decimal("0.0"), nouveau_restant)

    article.save()

    return JsonResponse({
        "article": {
            "id": article.id,
            "nom": article.nom,
            "type": article.type,
            "epaisseur": str(article.epaisseur),
            "prix_total": str(round(article.prix_total, 2)),
            "prix_restant": str(round(article.prix_restant, 2)),
            "prix_planche": str(round(total, 2))
        }
    }, status=200)

@csrf_exempt
def prix_total_detail(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    # 🔹 Calcul du nouveau prix total
    total = Decimal("0.0")
    for mesure in article.mesures.all():
        longueur = Decimal(mesure.longueur or 0)
        largeur = Decimal(mesure.largeur or 0)
        nombre = Decimal(mesure.nombre_de_fois or 0)
        total += longueur * largeur * nombre * Decimal("0.15")

    # 🔹 Calcul propre du prix restant
    ancien_total = article.prix_total or Decimal("0.0")
    ancien_restant = article.prix_restant or Decimal("0.0")

    article.prix_total = total

    # ✅ Si aucun paiement n’a été enregistré, le restant = total
    if ancien_total == 0 or ancien_restant == ancien_total:
        article.prix_restant = total
    else:
        # ✅ Si une partie a été payée, on conserve la même somme déjà payée
        montant_paye = ancien_total - ancien_restant
        nouveau_restant = total - montant_paye
        article.prix_restant = max(Decimal("0.0"), nouveau_restant)

    article.save()

    return JsonResponse({
        "article": {
            "id": article.id,
            "nom": article.nom,
            "type": article.type,
            "epaisseur": str(article.epaisseur),
            "prix_total": float(article.prix_total),
            "prix_restant": float(article.prix_restant),
        }
    })

@csrf_exempt
def paiement(request, article_id):
    article = get_object_or_404(Article, id=article_id)

    if request.method != "POST":
        return JsonResponse({"message": "Méthode non autorisée."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "Données JSON invalides."}, status=400)

    try:
        montant_paye = Decimal(str(data.get("montant_paye", 0)))
    except (ValueError, TypeError, Exception):
        return JsonResponse({"message": "Montant invalide."}, status=400)

    if montant_paye <= 0:
        return JsonResponse({"message": "Montant invalide."}, status=400)

    # ✅ Calculs avec Decimal (précision maximale)
    ancien_restant = article.prix_restant  # Déjà un Decimal
    nouveau_restant = max(Decimal('0.00'), ancien_restant - montant_paye)
    a_rendre = montant_paye - ancien_restant if montant_paye > ancien_restant else Decimal('0.00')
    manquant = ancien_restant - montant_paye if montant_paye < ancien_restant else Decimal('0.00')

    # ✅ Mise à jour du prix restant
    article.prix_restant = nouveau_restant
    article.save(update_fields=["prix_restant"])  # ✅ Seulement ce champ

    # ✅ Formatage pour JSON (convertir Decimal → float ou str)
    def to_float_or_none(value):
        return float(round(value, 2)) if value is not None else None

    # ✅ Message personnalisé
    if nouveau_restant == 0:
        message = f"✅ Article payé en totalité. À rendre : {to_float_or_none(a_rendre)} MAD."
        article.prix_restant = -1
        article.save(update_fields=["prix_restant"])
    else:
        message = f"💰 Paiement partiel enregistré. Reste {to_float_or_none(nouveau_restant)} MAD à payer."
        article.prix_restant = nouveau_restant
        article.save(update_fields=["prix_restant"])

    return JsonResponse({
        "message": message,
        "article": {
            "id": article.id,
            "nom": article.nom,
            "type": article.type,
            "epaisseur": to_float_or_none(article.epaisseur),
            "prix_total": to_float_or_none(article.prix_total),
            "prix_restant": to_float_or_none(article.prix_restant),
        },
        "a_rendre": to_float_or_none(a_rendre),
        "manquant": to_float_or_none(manquant),
    }, status=200)

def changer_prix_article(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    if request.method == "POST":
        # Ici tu pourrais traiter la modification du prix_payer si besoin
        return JsonResponse({
            "message": "prix_payer d'atelier modifié avec succès.",
            "atelier": {
                "id": article.id,
                "nom": article.type,
                "epaisseur": article.epaisseur
            }
        })
    return JsonResponse({
        "article": {
            "id": article.id,
            "nom": article.type,
            "epaisseur": article.epaisseur
        },
        "message": "GET request - données de l'article"
    })

def valider_mesure(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    if request.method == "POST":
        longueur = request.POST.get("longueur")
        largeur = request.POST.get("largeur")
        nombre_de_fois = request.POST.get("nombre_de_fois")
        if longueur and largeur and nombre_de_fois:
            Mesure.objects.create(
                article=article,
                longueur=longueur,
                largeur=largeur,
                nombre_de_fois=nombre_de_fois,
                encadrement_droite = request.POST.get("encadrement_droite") == "on",
                encadrement_gauche = request.POST.get("encadrement_gauche") == "on",
                encadrement_haut = request.POST.get("encadrement_haut") == "on",
                encadrement_bas = request.POST.get("encadrement_bas") == "on"
            )
            computed_total = sum(
                (float(m.longueur) if m.longueur else 0) *
                (float(m.largeur) if m.largeur else 0) *
                (float(m.nombre_de_fois) if m.nombre_de_fois else 0) * 0.5
                for m in article.mesures.all()
            )
            session_key = f"prix_payer_restant_{atelier_id}"
            request.session[session_key] = computed_total
            return JsonResponse({
                "message": f"Mesure ajoutée et liée à l'atelier. prix_payer total mis à jour: {computed_total:.2f} DH.",
                "atelier": {
                    "id": article.id,
                    "nom": article.type,
                    "epaisseur": article.epaisseur,
                    "prix_payer_total": round(computed_total, 2)
                }
            })
        else:
            return JsonResponse({
                "error": "Champs longueur, largeur et nombre_de_fois sont obligatoires."
            }, status=400)
    return JsonResponse({
        "atelier": {
            "id": article.id,
            "nom": article.type,
            "epaisseur": article.epaisseur
        },
        "message": "GET request - données de l'atelier"
    })

@csrf_exempt
def ajouter_mesure(request, article_id):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "JSON invalide."}, status=400)

    # Récupérer l'ID de l'article depuis le payload ou l'URL
    article_id_from_payload = data.get("article") or data.get("article_id") or article_id
    if not article_id_from_payload:
        return JsonResponse({"error": "Aucun article spécifié."}, status=400)

    article = get_object_or_404(Article, id=article_id_from_payload)

    # Récupérer les champs obligatoires
    longueur = data.get("longueur")
    largeur = data.get("largeur")
    nombre_de_fois = data.get("nombre_de_fois")
    if longueur is None or largeur is None or nombre_de_fois is None:
        return JsonResponse({"error": "Tous les champs sont requis."}, status=400)

    # Récupérer les encadrements (par défaut False)
    encadrement_droite = data.get("encadrement_droite", False)
    encadrement_gauche = data.get("encadrement_gauche", False)
    encadrement_haut = data.get("encadrement_haut", False)
    encadrement_bas = data.get("encadrement_bas", False)

    # Créer la mesure
    mesure = Mesure.objects.create(
        article=article,
        longueur=longueur,
        largeur=largeur,
        nombre_de_fois=nombre_de_fois,
        encadrement_droite=encadrement_droite,
        encadrement_gauche=encadrement_gauche,
        encadrement_haut=encadrement_haut,
        encadrement_bas=encadrement_bas
    )

    # Calculer le prix_payer total
    computed_total = sum(
        (float(m.longueur or 0)) *
        (float(m.largeur or 0)) *
        (float(m.nombre_de_fois or 0)) * 0.5
        for m in article.mesures.all()
    )

    request.session[f"prix_payer_restant_{article.id}"] = computed_total

    return JsonResponse({
        "message": f"Mesure ajoutée avec succès. prix_payer total mis à jour: {computed_total:.2f} DH.",
        "mesure": {
            "id": mesure.id,
            "longueur": mesure.longueur,
            "largeur": mesure.largeur,
            "nombre_de_fois": mesure.nombre_de_fois,
            "encadrements": {
                "droite": encadrement_droite,
                "gauche": encadrement_gauche,
                "haut": encadrement_haut,
                "bas": encadrement_bas
            }
        }
    })

def optimisation_decoupage(request, article_id):
    article_id = request.POST.get("article_id") or request.GET.get("article_id")
    if not article_id:
        return JsonResponse({"error": "Aucun atelier spécifié."}, status=400)

    article = get_object_or_404(Article, id=article_id)
    planche = article.planches.first()  # Récupère la première planche liée à l'atelier

    default_longueur = planche.longueur_initiale_mm / 10 if planche else 0
    default_largeur = planche.largeur_initiale_mm / 10 if planche else 0

    if request.method == "POST":
        try:
            planche_longueur = float(request.POST.get("board_length", default_longueur))
            planche_largeur = float(request.POST.get("board_width", default_largeur))
        except (TypeError, ValueError):
            return JsonResponse({"error": "Dimensions invalides."}, status=400)

        mesures = article.mesures.all()
        total_area = sum(
            (float(m.longueur) if m.longueur else 0) *
            (float(m.largeur) if m.largeur else 0) *
            (float(m.nombre_de_fois) if m.nombre_de_fois else 0)
            for m in mesures
        )

        board_area = planche_longueur * planche_largeur
        num_boards = math.ceil(total_area / board_area) if board_area > 0 else 0

        if num_boards > 0:
            average_area_used = total_area / num_boards
            leftover_per_board = board_area - average_area_used
            boards = [
                {
                    "board_number": i + 1,
                    "area_used": round(average_area_used, 2),
                    "leftover": round(leftover_per_board, 2)
                }
                for i in range(num_boards)
            ]
        else:
            boards = []

        return JsonResponse({
            "atelier": {
                "id": article.id,
                "nom": article.type,
                "epaisseur": article.epaisseur,
            },
            "board_length": planche_longueur,
            "board_width": planche_largeur,
            "board_area": round(board_area, 2),
            "total_area": round(total_area, 2),
            "num_boards": num_boards,
            "boards": boards,
            "schema": "Schéma d'agencement: [Disposition non implémentée]"
        })

    # Si GET : on retourne juste les infos de base
    return JsonResponse({
        "atelier": {
            "id": article.id,
            "nom": article.type,
            "epaisseur": article.epaisseur,
        },
        "board_length": default_longueur,
        "board_width": default_largeur,
        "message": "GET request - valeurs par défaut envoyées"
    })

@csrf_exempt
def marquer_article_valide(request, article_id):
    if request.method != "PATCH":
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    article = get_object_or_404(Article, id=article_id)
    article.valide = True
    article.save()

    return JsonResponse({
        "message": "Article validé avec succès",
        "article_id": article.id,
        "valide": article.valide
    })

import cairosvg, re, io
from reportlab.lib.pagesizes import A4
from PyPDF2 import PdfMerger

@csrf_exempt
def schema_pdf(request, article_id):
    if request.method != "GET":
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    try:
        article = Article.objects.get(id=article_id)

        # ✅ Récupérer tous les schémas SVG (s'il y a plusieurs planches)
        schema_svg = getattr(article, "schema", None)
        if not schema_svg:
            schema_svg = """
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
              <rect x="10" y="10" width="100" height="100" fill="blue"/>
              <circle cx="200" cy="100" r="50" fill="red"/>
            </svg>
            """

        # ✅ Extraire toutes les balises <svg>...</svg>
        matches = re.findall(r"<svg.*?</svg>", schema_svg, flags=re.DOTALL)
        if not matches:
            return JsonResponse({"error": "Aucun SVG valide trouvé"}, status=400)

        merger = PdfMerger()

        # ✅ Convertir chaque <svg> en PDF séparé et les fusionner
        for idx, svg in enumerate(matches, start=1):
            pdf_bytes = cairosvg.svg2pdf(bytestring=svg.encode("utf-8"))
            pdf_buffer = io.BytesIO(pdf_bytes)
            merger.append(pdf_buffer)

        # ✅ Sauvegarder le PDF final
        output_buffer = io.BytesIO()
        merger.write(output_buffer)
        merger.close()

        response = HttpResponse(output_buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="schema_{article_id}.pdf"'
        return response

    except Article.DoesNotExist:
        return JsonResponse({"error": "Article introuvable"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def valider_decouppage_valideur(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    planche = article.planches.first()
    default_longueur = planche.longueur_initiale_mm / 10
    default_largeur = planche.largeur_initiale_mm / 10

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
        except Exception:
            data = {}
        board_length = float(data.get("board_length", default_longueur))
        board_width = float(data.get("board_width", default_largeur))
    else:
        board_length = default_longueur
        board_width = default_largeur

    board_area = board_length * board_width
    mesures = article.mesures.all()

    total_area = sum(
        float(m.longueur) * float(m.largeur) * float(m.nombre_de_fois)
        for m in mesures
    )

    # Construction des pièces
    pieces = []
    for m in mesures:
        count = int(m.nombre_de_fois)
        for _ in range(count):
            pieces.append({
                'w': float(m.largeur),
                'h': float(m.longueur),
                'label': f"{m.longueur}x{m.largeur}",
                'encadree': m.encadrement_droite or m.encadrement_gauche or m.encadrement_haut or m.encadrement_bas
            })

    # Trier par aire décroissante
    pieces.sort(key=lambda p: p['w'] * p['h'], reverse=True)

    boards_detail = []
    remaining_pieces = pieces[:]
    while remaining_pieces:
        board = []
        shelf_y = 0
        shelf_height = 0
        current_x = 0

        for piece in remaining_pieces[:]:
            w, h = piece['w'], piece['h']
            if current_x + w > board_width:
                shelf_y += shelf_height
                current_x = 0
                shelf_height = 0
            if shelf_y + h > board_length:
                break

            piece['x'] = current_x
            piece['y'] = shelf_y
            piece['w_eff'] = w
            piece['h_eff'] = h
            piece['rotated'] = False
            board.append(piece)
            current_x += w
            shelf_height = max(shelf_height, h)
            remaining_pieces.remove(piece)

        boards_detail.append(board)

    num_boards = len(boards_detail)

    # ✅ Calcul des détails par planche avec aire totale/utilisée/restante
    detail_par_planches = []
    for i, board in enumerate(boards_detail):
        board_area_used = sum(piece['w_eff'] * piece['h_eff'] for piece in board)
        detail_par_planches.append({
            "board_number": i + 1,
            "area_total": board_area,
            "area_used": board_area_used,
            "area_rest": max(board_area - board_area_used, 0),
            "pieces": board,
        })

    # Génération du schéma SVG
    svgs = []
    for b in boards_detail:
        svg = f'<svg width="{board_width}" height="{board_length}" viewBox="0 0 {board_width} {board_length}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #000;">'
        for piece in b:
            svg += f'<rect x="{piece["x"]}" y="{piece["y"]}" width="{piece["w_eff"]}" height="{piece["h_eff"]}" fill="lightgreen" stroke="green" stroke-width="0.5"/>'
            svg += f'<text x="{piece["x"] + piece["w_eff"] / 2}" y="{piece["y"] + piece["h_eff"] / 2}" font-size="10" text-anchor="middle">{piece["label"]}</text>'
        svg += '</svg>'
        svgs.append(svg)

    schema = "<br>".join(svgs)
    article.schema = schema
    article.save(update_fields=["schema"])
    # Réponse JSON enrichie
    return JsonResponse({
        "article": {
            "id": article.id,
            "nom": article.type,
            "epaisseur": article.epaisseur,
        },
        "board_length": board_length,
        "board_width": board_width,
        "board_area": board_area,
        "total_area": total_area,
        "num_boards": num_boards,
        "detail_par_planches": detail_par_planches,
        "schema": article.schema,
        "schema_message": f"{num_boards} planche(s) nécessaires. Répartition des pièces optimisée.",
    })

def generate_schema(planche_longueur, planche_largeur, mesures):
    pieces = []
    for mesure in mesures:
        count = int(mesure.nombre_de_fois)
        for _ in range(count):
            pieces.append({
                'w': float(mesure.largeur),
                'h': float(mesure.longueur),
                'label': f"{mesure.longueur}x{mesure.largeur}"
            })
    pieces.sort(key=lambda p: p['w'] * p['h'], reverse=True)

    boards = []
    while pieces:
        board = []
        shelf_y = 0
        while shelf_y < planche_longueur:
            current_x = 0
            row_height = 0
            any_placed = False
            while current_x < planche_largeur:
                gap = planche_largeur - current_x
                candidate = None
                candidate_index = None
                best_diff = None
                for i, piece in enumerate(pieces):
                    for orientation in [(piece['w'], piece['h'], False), (piece['h'], piece['w'], True)]:
                        w_eff, h_eff, rotated = orientation
                        if w_eff <= gap and (shelf_y + h_eff <= planche_longueur):
                            diff = gap - w_eff
                            if best_diff is None or diff < best_diff:
                                best_diff = diff
                                candidate = piece.copy()
                                candidate['w_eff'] = w_eff
                                candidate['h_eff'] = h_eff
                                candidate['rotated'] = rotated
                                candidate_index = i
                if candidate is not None:
                    candidate['x'] = current_x
                    candidate['y'] = shelf_y
                    board.append(candidate)
                    current_x += candidate['w_eff']
                    row_height = max(row_height, candidate['h_eff'])
                    any_placed = True
                    del pieces[candidate_index]
                else:
                    break
            if not any_placed:
                break
            shelf_y += row_height
        boards.append(board)

    svgs = []
    for b in boards:
        if b:
            min_x = min(piece["x"] for piece in b)
            min_y = min(piece["y"] for piece in b)
            max_x = max(piece["x"] + piece["w_eff"] for piece in b)
            max_y = max(piece["y"] + piece["h_eff"] for piece in b)
            width_box = max_x - min_x
            height_box = max_y - min_y
        else:
            min_x = min_y = 0
            width_box = planche_largeur
            height_box = planche_longueur
        svg = f'<svg width="{width_box}" height="{height_box}" viewBox="{min_x} {min_y} {width_box} {height_box}" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:10px;">'
        for piece in b:
            svg += f'<rect x="{piece["x"]}" y="{piece["y"]}" width="{piece["w_eff"]}" height="{piece["h_eff"]}" fill="lightblue" stroke="blue" stroke-width="0.5"/>'
            svg += f'<text x="{piece["x"] + piece["w_eff"]/2}" y="{piece["y"] + piece["h_eff"]/2}" font-size="10" text-anchor="middle" fill="black">{piece["label"]}</text>'
        svg += '</svg>'
        svgs.append(svg)

    # ✅ Retourne un dictionnaire simple, pas un JsonResponse
    return {"schema": svgs}

def valider_decouppage(request, article_id):
    article = get_object_or_404(Article, id=article_id)
    planche = article.planches.first()
    default_longueur = planche.longueur_initiale_mm / 10 if planche else 200
    default_largeur = planche.largeur_initiale_mm / 10 if planche else 100

    if request.method == "POST":
        board_length = float(request.POST.get("board_length", default_longueur))
        board_width = float(request.POST.get("board_width", default_largeur))
    else:
        board_length = default_longueur
        board_width = default_largeur

    board_area = board_length * board_width
    mesures = article.mesures.all()

    total_area = sum(
        (float(m.longueur) if m.longueur else 0) *
        (float(m.largeur) if m.largeur else 0) *
        (float(m.nombre_de_fois) if m.nombre_de_fois else 0)
        for m in mesures
    )
    pieces = []
    for m in mesures:
        count = int(m.nombre_de_fois)
        for _ in range(count):
            pieces.append({
                'w': float(m.largeur),
                'h': float(m.longueur),
                'label': f"{m.longueur}x{m.largeur}",
                'encadree': m.encadrement_droite or m.encadrement_gauche or m.encadrement_haut or m.encadrement_bas
            })

    pieces.sort(key=lambda p: p['w'] * p['h'], reverse=True)
    boards_detail = []
    remaining_pieces = pieces[:]

    while remaining_pieces:
        board = []
        shelf_y = 0
        shelf_height = 0
        current_x = 0

        for piece in remaining_pieces[:]:
            w = piece['w']
            h = piece['h']

            if current_x + w > board_width:
                shelf_y += shelf_height
                current_x = 0
                shelf_height = 0

            if shelf_y + h > board_length:
                break

            piece['x'] = current_x
            piece['y'] = shelf_y
            piece['w_eff'] = w
            piece['h_eff'] = h
            piece['rotated'] = False

            board.append(piece)
            current_x += w
            shelf_height = max(shelf_height, h)
            remaining_pieces.remove(piece)

        boards_detail.append(board)

    num_boards = len(boards_detail)
    detail_par_planches = []
    for i, board in enumerate(boards_detail):
        board_area_used = sum(piece['w_eff'] * piece['h_eff'] for piece in board)
        detail_par_planches.append({
            "board_number": i + 1,
            "pieces": board,
            "area_used": board_area_used,
            "leftover": board_area - board_area_used,
        })

    schema = []
    for b in boards_detail:
        svg_elements = []
        for piece in b:
            svg_elements.append({
                "x": piece["x"],
                "y": piece["y"],
                "width": piece["w_eff"],
                "height": piece["h_eff"],
                "label": piece["label"]
            })
        schema.append(svg_elements)

    response_data = {
        "atelier_id": article.id,
        "planche_longueur": board_length,
        "planche_largeur": board_width,
        "board_area": board_area,
        "total_area_mesures": total_area,
        "nombre_planches": num_boards,
        "detail_par_planches": detail_par_planches,
        "schema": schema,
        "message": f"{num_boards} planches nécessaires. Voici le détail de la répartition des mesures par planche."
    }

    return JsonResponse(response_data)

def afficher_total_mesures(request):
    ateliers = Article.objects.all().prefetch_related('mesures')
    total_global = 0
    for article in ateliers:
        for mesure in article.mesures.all():
            total_global += (
                float(mesure.longueur or 0) *
                float(mesure.largeur or 0) *
                float(mesure.nombre_de_fois or 0)
            )
    return JsonResponse({"total_global": total_global})