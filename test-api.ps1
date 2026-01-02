$body = @{email="marco@serrano.marketing"; password="Serrano602450*"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.tokens.accessToken
$headers = @{Authorization = "Bearer $token"; "Content-Type" = "application/json"}

$endpoints = @(
    @{name="USERS"; url="http://localhost:4000/api/users"},
    @{name="CLIENTS"; url="http://localhost:4000/api/clients"},
    @{name="SERVICES"; url="http://localhost:4000/api/services"},
    @{name="SERVICE CATEGORIES"; url="http://localhost:4000/api/services/categories"},
    @{name="APPOINTMENTS"; url="http://localhost:4000/api/appointments?startDate=2026-01-01&endDate=2026-01-31"},
    @{name="DASHBOARD"; url="http://localhost:4000/api/dashboard"},
    @{name="SETTINGS"; url="http://localhost:4000/api/settings"}
)

Write-Host "`n========== GET ENDPOINTS ==========`n" -ForegroundColor Yellow

foreach ($ep in $endpoints) {
    Write-Host "=== $($ep.name) ===" -ForegroundColor Cyan
    try { 
        $r = Invoke-RestMethod -Uri $ep.url -Headers $headers -ErrorAction Stop
        if ($r.success) {
            Write-Host "OK" -ForegroundColor Green
        } else {
            Write-Host "FAIL: $($r.message)" -ForegroundColor Yellow
        }
    } catch { 
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "ERROR $statusCode : $($_.Exception.Message)" -ForegroundColor Red 
    }
}

Write-Host "`n========== POST TESTS ==========`n" -ForegroundColor Yellow

# Test crear cliente
Write-Host "=== CREATE CLIENT ===" -ForegroundColor Cyan
try {
    $clientData = @{firstName="Test"; lastName="Cliente"; email="test@test.com"; phone="+123456789"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:4000/api/clients" -Method POST -Headers $headers -Body $clientData -ErrorAction Stop
    if ($r.success) {
        Write-Host "OK - Client created: $($r.data.id)" -ForegroundColor Green
        $testClientId = $r.data.id
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test crear categoría
Write-Host "=== CREATE CATEGORY ===" -ForegroundColor Cyan
try {
    $catData = @{name="Test Category"; description="Test"; color="#FF5733"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:4000/api/services/categories" -Method POST -Headers $headers -Body $catData -ErrorAction Stop
    if ($r.success) {
        Write-Host "OK - Category created: $($r.data.id)" -ForegroundColor Green
        $testCatId = $r.data.id
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test crear servicio
Write-Host "=== CREATE SERVICE ===" -ForegroundColor Cyan
try {
    $svcData = @{name="Test Service"; duration=60; price=100; description="Test service"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "http://localhost:4000/api/services" -Method POST -Headers $headers -Body $svcData -ErrorAction Stop
    if ($r.success) {
        Write-Host "OK - Service created: $($r.data.id)" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== DONE ==========`n" -ForegroundColor Yellow
