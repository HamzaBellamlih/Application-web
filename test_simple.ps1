# Script de test simple pour l'API JWT
Write-Host "=== Test de l'API JWT ===" -ForegroundColor Green

# Test 1: Connexion
Write-Host "`n1. Test de connexion..." -ForegroundColor Yellow

$loginData = @{
    username = "testuser"
    password = "testpass"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/login/" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "Token reçu: $($response.token)" -ForegroundColor Cyan
    
    # Test 2: Accès aux informations client
    Write-Host "`n2. Test d'accès aux informations client..." -ForegroundColor Yellow
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $($response.token)"
    }
    
    $clientInfo = Invoke-RestMethod -Uri "http://localhost:8000/api/client_info/" -Method GET -Headers $headers
    Write-Host "✅ Informations client récupérées!" -ForegroundColor Green
    Write-Host "Nom: $($clientInfo.nom)" -ForegroundColor White
    Write-Host "Prénom: $($clientInfo.prenom)" -ForegroundColor White
    Write-Host "Email: $($clientInfo.email)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n=== Test terminé ===" -ForegroundColor Green 