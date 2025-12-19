# Test logout API
$API_BASE = "http://118.89.79.13"

Write-Host "Testing logout API..." -ForegroundColor Green

# 1. Login
Write-Host "`n[1] Login..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    if ($loginResponse.code -eq 200) {
        Write-Host "Login successful" -ForegroundColor Green
        $accessToken = $loginResponse.data.accessToken
        Write-Host "Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Gray
        
        # 2. Test logout without Cookie
        Write-Host "`n[2] Test logout (without Cookie, simulate expired refreshToken)..." -ForegroundColor Yellow
        $headers = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        }
        
        try {
            $logoutResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/logout" `
                -Method POST `
                -Headers $headers `
                -Body "{}"
            
            Write-Host "Logout successful!" -ForegroundColor Green
            Write-Host "Response: $($logoutResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Logout failed, status code: $statusCode" -ForegroundColor Red
            
            if ($statusCode -eq 400) {
                Write-Host "Issue confirmed: 400 error returned, need to deploy latest code" -ForegroundColor Yellow
            }
            
            # Read error response
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "Error response: $responseBody" -ForegroundColor Red
            } catch {
                Write-Host "Cannot read error response" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Login failed: $($loginResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 502) {
            Write-Host "`nNote: 502 error means server is not running or port is wrong" -ForegroundColor Yellow
            Write-Host "Please check:" -ForegroundColor Yellow
            Write-Host "1. Is backend service running? (pm2 list)" -ForegroundColor Yellow
            Write-Host "2. Is port correct? (netstat -tlnp | grep 3001)" -ForegroundColor Yellow
            Write-Host "3. Is Nginx config correct?" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTest completed" -ForegroundColor Green

