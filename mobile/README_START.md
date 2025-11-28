# 🚀 Expo Başlatma Rehberi

## Hızlı Başlatma

### Yöntem 1: Hazır Script (Önerilen)

**Windows PowerShell:**
```powershell
.\start-expo.ps1
```

**Windows CMD:**
```cmd
start-expo.bat
```

### Yöntem 2: Manuel Başlatma

```bash
cd mobile
npx expo start
```

## Expo Login (Gerekirse)

Eğer Expo login gerekiyorsa:

```bash
npx expo login
```

Kullanıcı adı: `muratcanyalin`  
Şifre: `Aa12345678!`

## Görüntüleme Seçenekleri

### 1. Expo Go (Telefon)
1. Telefonunuza **Expo Go** uygulamasını indirin
2. QR kodu tarayın
3. Uygulama açılacak

### 2. Web Tarayıcı
```bash
npx expo start --web
```

### 3. Tunnel Mode (İnternet üzerinden)
```bash
npx expo start --tunnel
```

## Sorun Giderme

### React Native bulunamıyor hatası
```bash
cd mobile
npm install
npx expo install --fix
```

### Cache temizleme
```bash
npx expo start --clear
```

### Port değiştirme
```bash
npx expo start --port 8081
```

## Environment Variables

`.env` dosyası otomatik oluşturulur. Manuel oluşturmak için:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Gerçek cihaz için IP adresinizi kullanın:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

## Backend Bağlantısı

Backend'in çalıştığından emin olun:

```bash
cd backend
npm run dev
```

Backend `http://localhost:3001` adresinde çalışmalı.

## Canlı URL

Expo başladığında şu URL'lerden birini göreceksiniz:
- `exp://192.168.1.100:8081` (Local network)
- `exp://u.expo.dev/...` (Tunnel mode)

Bu URL'yi Expo Go uygulamasında açabilirsiniz.

