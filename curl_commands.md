# 🧪 Commandes cURL pour tester l'API JWT

## 1. Test de connexion (Login)

```bash
# Test avec des identifiants valides
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass"
  }'
```

**Réponse attendue :**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "message": "Connexion réussie"
}
```

## 2. Test d'accès aux informations client (avec token valide)

```bash
# Remplacez YOUR_TOKEN_HERE par le token reçu de l'étape 1
curl -X GET http://localhost:8000/api/client_info/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue :**
```json
{
  "id": 1,
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@email.com",
  "adresse": "123 Rue de la Paix",
  "telephone": "0123456789",
  "username": "testuser"
}
```

## 3. Test avec un token invalide

```bash
curl -X GET http://localhost:8000/api/client_info/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_here"
```

**Réponse attendue :**
```json
{
  "error": "Token invalide"
}
```

## 4. Test sans token

```bash
curl -X GET http://localhost:8000/api/client_info/ \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "error": "Token manquant ou format invalide"
}
```

## 5. Test avec un token expiré

```bash
# Utilisez un token qui a expiré
curl -X GET http://localhost:8000/api/client_info/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EXPIRED_TOKEN_HERE"
```

**Réponse attendue :**
```json
{
  "error": "Token expiré"
}
```

## 🔧 Script de test automatique

Pour exécuter tous les tests automatiquement :

```bash
# Rendre le script exécutable
chmod +x test_api.sh

# Exécuter les tests
./test_api.sh
```

## 📝 Notes importantes

1. **Remplacez les identifiants** : Utilisez des identifiants qui existent dans votre base de données
2. **Vérifiez le serveur** : Assurez-vous que votre serveur Django tourne sur `localhost:8000`
3. **CORS** : Vérifiez que CORS est configuré pour permettre les requêtes depuis `localhost:3000`
4. **Base de données** : Assurez-vous d'avoir des clients dans votre base de données

## 🐛 Débogage

Si vous obtenez des erreurs :

1. **500 Internal Server Error** : Vérifiez les logs Django
2. **404 Not Found** : Vérifiez les URLs dans `urls.py`
3. **401 Unauthorized** : Vérifiez la génération et validation des tokens JWT
4. **CORS errors** : Vérifiez la configuration CORS dans Django 