# 🧪 Commandes cURL pour Windows PowerShell

## 1. Test de connexion (Login)

```powershell
# Test avec des identifiants valides
curl -X POST http://localhost:8000/api/login/ `
  -H "Content-Type: application/json" `
  -d '{\"username\": \"testuser\", \"password\": \"testpass\"}'
```

**Alternative avec Invoke-RestMethod :**
```powershell
$body = @{
    username = "testuser"
    password = "testpass"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/login/" -Method POST -Body $body -ContentType "application/json"
```

## 2. Test d'accès aux informations client (avec token valide)

```powershell
# Remplacez YOUR_TOKEN_HERE par le token reçu de l'étape 1
curl -X GET http://localhost:8000/api/client_info/ `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Alternative avec Invoke-RestMethod :**
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/client_info/" -Method GET -Headers $headers
```

## 3. Test avec un token invalide

```powershell
curl -X GET http://localhost:8000/api/client_info/ `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer invalid_token_here"
```

## 4. Test sans token

```powershell
curl -X GET http://localhost:8000/api/client_info/ `
  -H "Content-Type: application/json"
```

## 5. Script PowerShell complet

```powershell
# Script de test complet pour PowerShell
Write-Host "🧪 Tests de l'API d'authentification JWT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$API_BASE = "http://localhost:8000"

Write-Host "`n1️⃣ Test de connexion (Login)" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

# Test de connexion
$loginBody = @{
    username = "testuser"
    password = "testpass"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/api/login/" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Connexion réussie" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token)" -ForegroundColor Cyan
    
    $token = $loginResponse.token
    
    Write-Host "`n2️⃣ Test d'accès aux informations client" -ForegroundColor Yellow
    Write-Host "---------------------------------------" -ForegroundColor Yellow
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    $clientResponse = Invoke-RestMethod -Uri "$API_BASE/api/client_info/" -Method GET -Headers $headers
    Write-Host "✅ Informations client récupérées" -ForegroundColor Green
    Write-Host "Nom: $($clientResponse.nom)" -ForegroundColor Cyan
    Write-Host "Prénom: $($clientResponse.prenom)" -ForegroundColor Cyan
    Write-Host "Email: $($clientResponse.email)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3️⃣ Test avec un token invalide" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

try {
    $invalidHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer invalid_token_here"
    }
    
    $invalidResponse = Invoke-RestMethod -Uri "$API_BASE/api/client_info/" -Method GET -Headers $invalidHeaders
} catch {
    Write-Host "✅ Erreur attendue avec token invalide: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n✅ Tests terminés !" -ForegroundColor Green
```

## 🔧 Utilisation

1. **Ouvrez PowerShell** en tant qu'administrateur
2. **Naviguez vers votre dossier** : `cd "C:\Users\Dell\OneDrive\Desktop\Stage1"`
3. **Exécutez les commandes** une par une ou le script complet

## 📝 Notes pour Windows

- Utilisez les **backticks** (`) pour les retours à la ligne dans PowerShell
- Les **guillemets doubles** doivent être échappés avec `\"`
- **Invoke-RestMethod** est souvent plus fiable que `curl` sur Windows
- Si `curl` ne fonctionne pas, utilisez les alternatives avec **Invoke-RestMethod** 