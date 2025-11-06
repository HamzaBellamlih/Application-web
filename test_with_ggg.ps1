# Script de test avec l'utilisateur GGG
Write-Host "=== Test de l'API JWT avec GGG ===" -ForegroundColor Green

# Test 1: Connexion avec GGG
Write-Host "`n1. Test de connexion avec GGG..." -ForegroundColor Yellow

$loginData = @{
    username = "GGG"
    password = "ton_mot_de_passe"  # Remplace par le vrai mot de passe de GGG
} | ConvertTo-Json

Write-Host "Données envoyées: $loginData" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/login/" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "Réponse complète: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    if ($response.token) {
        Write-Host "Token reçu: $($response.token)" -ForegroundColor Green
        
        # Test 2: Accès aux informations client
        Write-Host "`n2. Test d'accès aux informations client..." -ForegroundColor Yellow
        
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $($response.token)"
        }
        
        Write-Host "Headers envoyés: $($headers | ConvertTo-Json)" -ForegroundColor Gray
        
        $clientInfo = Invoke-RestMethod -Uri "http://localhost:8000/api/client_info/" -Method GET -Headers $headers
        Write-Host "✅ Informations client récupérées!" -ForegroundColor Green
        Write-Host "Données client: $($clientInfo | ConvertTo-Json -Depth 3)" -ForegroundColor White
        
    } else {
        Write-Host "❌ Aucun token reçu dans la réponse!" -ForegroundColor Red
        Write-Host "La réponse ne contient pas de token JWT." -ForegroundColor Red
        Write-Host "Vérifiez que votre backend génère bien un token." -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur lors de la connexion:" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Code de statut: $statusCode" -ForegroundColor Red
        
        # Essayer de lire le contenu de l'erreur
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "Contenu de l'erreur: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "Impossible de lire le contenu de l'erreur" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Test terminé ===" -ForegroundColor Green 