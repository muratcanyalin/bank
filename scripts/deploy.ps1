# Deployment Script - Production ortamına deploy için hazırlık

Write-Host "🚀 Mini Banking Platform - Deployment Preparation" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Environment Check
Write-Host "1. Environment Check" -ForegroundColor Yellow
if ($env:NODE_ENV -ne "production") {
    Write-Host "⚠️  NODE_ENV is not set to 'production'" -ForegroundColor Yellow
    Write-Host "   Setting NODE_ENV=production for this session..." -ForegroundColor Yellow
    $env:NODE_ENV = "production"
}
Write-Host "✅ Environment: $env:NODE_ENV" -ForegroundColor Green
Write-Host ""

# Step 2: Security Check
Write-Host "2. Security Configuration Check" -ForegroundColor Yellow
$envFile = "backend\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "JWT_SECRET=.*change-this") {
        Write-Host "❌ JWT_SECRET hala default değerde! Production için değiştirin!" -ForegroundColor Red
    } else {
        Write-Host "✅ JWT_SECRET configured" -ForegroundColor Green
    }
    
    if ($envContent -notmatch "NODE_ENV=production") {
        Write-Host "⚠️  NODE_ENV production olarak ayarlanmalı" -ForegroundColor Yellow
    }
    
    if ($envContent -notmatch "DATABASE_URL=.*ssl") {
        Write-Host "⚠️  Database SSL connection önerilir (production)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
}
Write-Host ""

# Step 3: Build Check
Write-Host "3. Build Check" -ForegroundColor Yellow
Write-Host "Building backend..." -ForegroundColor White
Set-Location backend
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host ""

# Step 4: Database Migration Check
Write-Host "4. Database Migration Check" -ForegroundColor Yellow
Write-Host "⚠️  Production migration'ları manuel olarak çalıştırın:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run prisma:migrate deploy" -ForegroundColor White
Write-Host ""

# Step 5: Docker (Optional)
Write-Host "5. Docker Deployment (Optional)" -ForegroundColor Yellow
$dockerFile = "Dockerfile"
if (-not (Test-Path $dockerFile)) {
    Write-Host "📝 Creating Dockerfile..." -ForegroundColor Yellow
    # Dockerfile will be created separately
    Write-Host "✅ Dockerfile will be created" -ForegroundColor Green
}
Write-Host ""

# Step 6: PM2 Configuration (Optional)
Write-Host "6. PM2 Process Manager (Optional)" -ForegroundColor Yellow
Write-Host "Production için PM2 kullanımı önerilir:" -ForegroundColor White
Write-Host "   npm install -g pm2" -ForegroundColor White
Write-Host "   pm2 start backend/dist/index.js --name banking-api" -ForegroundColor White
Write-Host "   pm2 save" -ForegroundColor White
Write-Host "   pm2 startup" -ForegroundColor White
Write-Host ""

# Step 7: Checklist
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📋 Production Deployment Checklist" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Build completed" -ForegroundColor Green
Write-Host "⬜ Environment variables configured" -ForegroundColor White
Write-Host "⬜ Database migrations deployed" -ForegroundColor White
Write-Host "⬜ SSL/TLS certificates configured" -ForegroundColor White
Write-Host "⬜ Reverse proxy configured (nginx/apache)" -ForegroundColor White
Write-Host "⬜ Firewall rules configured" -ForegroundColor White
Write-Host "⬜ Monitoring & logging setup" -ForegroundColor White
Write-Host "⬜ Backup strategy in place" -ForegroundColor White
Write-Host "⬜ Security headers verified" -ForegroundColor White
Write-Host "⬜ Rate limiting configured" -ForegroundColor White
Write-Host "⬜ Error tracking (Sentry, etc.) configured" -ForegroundColor White
Write-Host ""


