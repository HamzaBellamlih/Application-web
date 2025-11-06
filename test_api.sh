#!/bin/bash

echo "🧪 Tests de l'API d'authentification JWT"
echo "========================================"

# Configuration
API_BASE="http://localhost:8000"
TOKEN_FILE="temp_token.txt"

echo ""
echo "1️⃣ Test de connexion (Login)"
echo "----------------------------"

# Test avec des identifiants valides
echo "📝 Tentative de connexion avec un client..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass"
  }')

echo "Réponse du serveur:"
echo "$LOGIN_RESPONSE"

# Extraire le token de la réponse
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Token extrait: $TOKEN"
    echo "$TOKEN" > "$TOKEN_FILE"
else
    echo "❌ Aucun token trouvé dans la réponse"
    echo "💡 Vérifiez que votre backend génère bien un token JWT"
fi

echo ""
echo "2️⃣ Test d'accès aux informations client"
echo "---------------------------------------"

if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
    echo "🔐 Utilisation du token: $TOKEN"
    
    CLIENT_RESPONSE=$(curl -s -X GET "$API_BASE/api/client_info/" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Réponse du serveur:"
    echo "$CLIENT_RESPONSE"
else
    echo "❌ Aucun token disponible pour le test"
fi

echo ""
echo "3️⃣ Test avec un token invalide"
echo "-------------------------------"

INVALID_RESPONSE=$(curl -s -X GET "$API_BASE/api/client_info/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_here")

echo "Réponse avec token invalide:"
echo "$INVALID_RESPONSE"

echo ""
echo "4️⃣ Test sans token"
echo "------------------"

NO_TOKEN_RESPONSE=$(curl -s -X GET "$API_BASE/api/client_info/" \
  -H "Content-Type: application/json")

echo "Réponse sans token:"
echo "$NO_TOKEN_RESPONSE"

# Nettoyage
if [ -f "$TOKEN_FILE" ]; then
    rm "$TOKEN_FILE"
    echo ""
    echo "🧹 Fichier temporaire supprimé"
fi

echo ""
echo "✅ Tests terminés !" 