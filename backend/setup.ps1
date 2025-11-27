# Backend Setup Script
# Bu script backend'in çalışması için gerekli tüm adımları otomatik olarak yapar

Write-Host "🚀 Mini Banking Platform - Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js bulunamadı! Lütfen Node.js yükleyin." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Check PostgreSQL connection
Write-Host "🗄️  Checking PostgreSQL..." -ForegroundColor Yellow
$pgTest = psql -U postgres -d postgres -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  PostgreSQL bağlantısı test edilemedi." -ForegroundColor Yellow
    Write-Host "⚠️  Lütfen PostgreSQL'in çalıştığından ve 'postgres' kullanıcısının şifresinin 'postgres' olduğundan emin olun." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Devam edilsin mi? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
} else {
    Write-Host "✅ PostgreSQL bağlantısı başarılı" -ForegroundColor Green
}
Write-Host ""

# Step 3: Create database if not exists
Write-Host "📊 Creating database 'banking_db'..." -ForegroundColor Yellow
$dbExists = psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='banking_db';" 2>&1
if ($dbExists -notmatch "1") {
    $createDb = psql -U postgres -d postgres -c "CREATE DATABASE banking_db;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database 'banking_db' oluşturuldu" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database oluşturulamadı. Manuel olarak oluşturun: CREATE DATABASE banking_db;" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Database 'banking_db' zaten mevcut" -ForegroundColor Green
}
Write-Host ""

# Step 4: Create .env file
Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    $jwtSecret = [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
    $jwtRefreshSecret = [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
    
    $envContent = @"
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/banking_db?schema=public"

# JWT
JWT_SECRET="$jwtSecret"
JWT_REFRESH_SECRET="$jwtRefreshSecret"
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
    Write-Host "✅ .env dosyası zaten mevcut" -ForegroundColor Green
}
Write-Host ""

# Step 5: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependencies yüklenemedi!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies yüklendi" -ForegroundColor Green
Write-Host ""

# Step 6: Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma Client generate edilemedi!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generate edildi" -ForegroundColor Green
Write-Host ""

# Step 7: Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration hatası! Database bağlantısını kontrol edin." -ForegroundColor Yellow
    Write-Host "⚠️  Manuel olarak çalıştırabilirsiniz: npm run prisma:migrate" -ForegroundColor Yellow
} else {
    Write-Host "✅ Migrations tamamlandı" -ForegroundColor Green
}
Write-Host ""

# Step 8: Seed database
Write-Host "🌱 Seeding database (roles & permissions)..." -ForegroundColor Yellow
$seed = Read-Host "Seed çalıştırılsın mı? (y/n)"
if ($seed -eq "y" -or $seed -eq "Y") {
    npm run seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seed edildi" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Seed hatası!" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 9: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Backend setup tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Server'ı başlatmak için:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📊 Server çalıştığında:" -ForegroundColor Cyan
Write-Host "   - Backend: http://localhost:3001" -ForegroundColor White
Write-Host "   - Health: http://localhost:3001/health" -ForegroundColor White
Write-Host "   - DB Test: http://localhost:3001/api/test-db" -ForegroundColor White
Write-Host ""


