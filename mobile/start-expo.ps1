# Expo Başlatma Scripti
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Başlatma Scripti" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Script'in bulunduğu klasöre git (mobile klasörü)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Çalışma dizini: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# app.json kontrolü - Expo projesi olduğunu doğrula
if (-not (Test-Path "app.json")) {
    Write-Host "HATA: app.json bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen mobile klasöründe olduğunuzdan emin olun." -ForegroundColor Yellow
    Write-Host "Mevcut dizin: $(Get-Location)" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "✓ app.json bulundu" -ForegroundColor Green

# Environment variables kontrolü
if (-not (Test-Path .env)) {
    Write-Host "Uyarı: .env dosyası bulunamadı!" -ForegroundColor Yellow
    Write-Host ".env dosyası oluşturuluyor..." -ForegroundColor Yellow
    @"
EXPO_PUBLIC_API_URL=http://localhost:3001
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host ".env dosyası oluşturuldu!" -ForegroundColor Green
}

# Node modules kontrolü
if (-not (Test-Path node_modules)) {
    Write-Host "Node modules yükleniyor..." -ForegroundColor Yellow
    npm install
}

# Expo'yu başlat
Write-Host "Expo başlatılıyor..." -ForegroundColor Green
Write-Host "QR kodu görmek için terminal çıktısını kontrol edin!" -ForegroundColor Cyan
Write-Host "Web'de açmak için: npx expo start --web" -ForegroundColor Cyan
Write-Host ""

npx expo start

