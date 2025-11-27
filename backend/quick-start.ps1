# Quick Start Script for Windows PowerShell

Write-Host "🚀 Mini Banking Platform - Quick Start" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env dosyası bulunamadı. Oluşturuluyor..." -ForegroundColor Yellow
    
    $envContent = @"
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/banking_db?schema=public"

# JWT
JWT_SECRET="$(New-Guid)-$(New-Guid)-$(New-Guid)"
JWT_REFRESH_SECRET="$(New-Guid)-$(New-Guid)-$(New-Guid)"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MFA
MFA_ISSUER="Mini Banking Platform"

# CORS
FRONTEND_URL=http://localhost:3000
MOBILE_URL=http://localhost:19006
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env dosyası oluşturuldu" -ForegroundColor Green
} else {
    Write-Host "✅ .env dosyası mevcut" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Prisma Client generate ediliyor..." -ForegroundColor Cyan
npm run prisma:generate

Write-Host ""
Write-Host "🗄️  Database migration çalıştırılıyor..." -ForegroundColor Cyan
Write-Host "⚠️  Not: PostgreSQL veritabanının çalıştığından emin olun!" -ForegroundColor Yellow
Write-Host "⚠️  Not: 'banking_db' veritabanının oluşturulduğundan emin olun!" -ForegroundColor Yellow
Write-Host ""
$migrate = Read-Host "Migration çalıştırılsın mı? (y/n)"
if ($migrate -eq "y" -or $migrate -eq "Y") {
    npm run prisma:migrate
    Write-Host ""
    $seed = Read-Host "Seed (roles & permissions) çalıştırılsın mı? (y/n)"
    if ($seed -eq "y" -or $seed -eq "Y") {
        npm run seed
    }
}

Write-Host ""
Write-Host "✅ Hazır! Şimdi 'npm run dev' ile server'ı başlatabilirsiniz" -ForegroundColor Green


