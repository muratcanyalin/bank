# Test Script - Tüm özellikleri test eder

Write-Host "🧪 Mini Banking Platform - Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "http://localhost:3001"
$testResults = @()

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $statusCode = 200
        
        Write-Host " ✅ PASS" -ForegroundColor Green
        return @{ Success = $true; Name = $Name }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host " ✅ PASS (Expected $ExpectedStatus)" -ForegroundColor Green
            return @{ Success = $true; Name = $Name }
        } else {
            Write-Host " ❌ FAIL (Status: $statusCode)" -ForegroundColor Red
            return @{ Success = $false; Name = $Name; Error = $_.Exception.Message }
        }
    }
}

# Test 1: Health Check
Write-Host "`n1. Health Check Tests" -ForegroundColor Cyan
$testResults += Test-Endpoint -Name "Health Check" -Method "GET" -Url "$backendUrl/health"

# Test 2: Database Connection
Write-Host "`n2. Database Tests" -ForegroundColor Cyan
$testResults += Test-Endpoint -Name "Database Connection" -Method "GET" -Url "$backendUrl/api/test-db"

# Test 3: Authentication
Write-Host "`n3. Authentication Tests" -ForegroundColor Cyan
$registerBody = @{
    email = "test@example.com"
    password = "Test1234!"
    firstName = "Test"
    lastName = "User"
}
$testResults += Test-Endpoint -Name "User Registration" -Method "POST" -Url "$backendUrl/api/auth/register" -Body $registerBody

$loginBody = @{
    email = "test@example.com"
    password = "Test1234!"
}
$loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method "POST" -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.accessToken

$testResults += Test-Endpoint -Name "User Login" -Method "POST" -Url "$backendUrl/api/auth/login" -Body $loginBody

# Test 4: Protected Endpoints
Write-Host "`n4. Protected Endpoint Tests" -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $token"
}
$testResults += Test-Endpoint -Name "Get User Info" -Method "GET" -Url "$backendUrl/api/auth/me" -Headers $headers
$testResults += Test-Endpoint -Name "List Accounts" -Method "GET" -Url "$backendUrl/api/accounts" -Headers $headers
$testResults += Test-Endpoint -Name "Get Balances" -Method "GET" -Url "$backendUrl/api/balances" -Headers $headers

# Test 5: Rate Limiting
Write-Host "`n5. Rate Limiting Tests" -ForegroundColor Cyan
Write-Host "Testing rate limit (may take a moment)..." -ForegroundColor Yellow
$rateLimitTest = 0
for ($i = 1; $i -le 105; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/test-db" -Method "GET" -ErrorAction Stop
        $rateLimitTest = $i
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-Host " ✅ Rate limit triggered at request $i" -ForegroundColor Green
            $testResults += @{ Success = $true; Name = "Rate Limiting" }
            break
        }
    }
}

# Summary
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Success -eq $true }).Count
$failed = ($testResults | Where-Object { $_.Success -eq $false }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed. Check output above." -ForegroundColor Red
}


