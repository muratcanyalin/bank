# Backend Başlatma Scripti
Write-Host "🚀 Backend başlatılıyor (Port: 3003)..." -ForegroundColor Cyan
Write-Host ""

cd $PSScriptRoot
$env:PORT=3003
npm run dev

