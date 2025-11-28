@echo off
echo Expo baslatiliyor...
cd /d %~dp0

if not exist .env (
    echo .env dosyasi olusturuluyor...
    echo EXPO_PUBLIC_API_URL=http://localhost:3001 > .env
    echo .env dosyasi olusturuldu!
)

if not exist node_modules (
    echo Node modules yukleniyor...
    call npm install
)

echo.
echo Expo baslatiliyor...
echo QR kodu gormek icin terminal ciktisini kontrol edin!
echo Web'de acmak icin: npx expo start --web
echo.

call npx expo start

pause

