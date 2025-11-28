# Expo Başlatma Scripti - Düzeltilmiş Versiyon
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo Başlatma Scripti" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Script'in bulunduğu klasöre git (mobile klasörü)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Çalışma dizini: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# app.json kontrolü
if (-not (Test-Path "app.json")) {
    Write-Host "HATA: app.json bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen mobile klasöründe olduğunuzdan emin olun." -ForegroundColor Yellow
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
    Write-Host "✓ .env dosyası oluşturuldu!" -ForegroundColor Green
} else {
    Write-Host "✓ .env dosyası mevcut" -ForegroundColor Green
}

# Node modules kontrolü
if (-not (Test-Path "node_modules\react-native")) {
    Write-Host "Uyarı: react-native bulunamadı!" -ForegroundColor Yellow
    Write-Host "Node modules yükleniyor..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Node modules yüklendi" -ForegroundColor Green
} else {
    Write-Host "✓ Node modules mevcut" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Expo başlatılıyor..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "QR kodu görmek için terminal çıktısını kontrol edin!" -ForegroundColor Yellow
Write-Host "Web'de açmak için: w tuşuna basın" -ForegroundColor Yellow
Write-Host "Android için: a tuşuna basın" -ForegroundColor Yellow
Write-Host "iOS için: i tuşuna basın" -ForegroundColor Yellow
Write-Host ""

# Expo'yu başlat
npx expo start

