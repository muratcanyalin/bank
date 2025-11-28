# 🚀 Hızlı Başlangıç - Expo Live

## Expo'da Canlı Görüntüleme

### Adım 1: Bağımlılıkları Yükleyin

```bash
cd mobile
npm install
```

### Adım 2: Expo'yu Başlatın

```bash
npx expo start
```

### Adım 3: Uygulamayı Görüntüleyin

#### Seçenek 1: Expo Go (Telefon)

1. Telefonunuza **Expo Go** uygulamasını indirin:

   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. QR kodu tarayın:
   - **iOS**: Camera app ile QR kodu tarayın
   - **Android**: Expo Go app içinden QR kodu tarayın

#### Seçenek 2: Web Tarayıcı

```bash
npx expo start --web
```

Tarayıcıda otomatik açılacak: http://localhost:19006

#### Seçenek 3: Emulator/Simulator

```bash
# Android
npx expo start --android

# iOS (Mac only)
npx expo start --ios
```

### Adım 4: Environment Variables

`.env` dosyası oluşturun (mobile klasöründe):

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**ÖNEMLİ:** Gerçek cihaz için bilgisayarınızın IP adresini kullanın:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

IP adresinizi öğrenmek için:

- Windows: `ipconfig` (IPv4 Address)
- Mac/Linux: `ifconfig` veya `ip addr`

### Adım 5: Backend'i Başlatın

Yeni bir terminal açın:

```bash
cd backend
npm run dev
```

Backend `http://localhost:3001` adresinde çalışmalı.

## 📱 Yeni Özellikler

### ✅ Dashboard

- Şube bilgileri gösterimi
- Hesaplar listesi
- Hızlı işlemler

### ✅ İşlem Geçmişi

- Gelişmiş filtreleme (tür, durum)
- Dekont alma (PDF)
- İşlem detayları

### ✅ Faturalar

- Fatura sorgulama
- Fatura ödeme
- Otomatik ödeme talimatı
- localStorage ile kalıcılık

## 🔧 Sorun Giderme

### Metro bundler hatası

```bash
npx expo start --clear
```

### Cache temizleme

```bash
npx expo start -c
```

### Port değiştirme

```bash
npx expo start --port 8081
```

### Backend bağlantı hatası

- Backend'in çalıştığından emin olun
- `.env` dosyasındaki API URL'ini kontrol edin
- Gerçek cihaz için IP adresini kullanın (localhost değil)

### Expo Go'da bazı özellikler çalışmıyor

- Bazı native modüller Expo Go'da çalışmayabilir
- Production build için EAS Build kullanın (bakınız: EXPO_PUBLISH.md)

## 📦 Expo Dev Tools

Expo başladığında klavye kısayolları:

- `w` - Web'de aç
- `a` - Android emulator'de aç
- `i` - iOS simulator'de aç (Mac only)
- `r` - Reload
- `m` - Dev menu aç
- `c` - Cache temizle

## 🌐 Canlı URL Paylaşımı

Expo başladığında şu URL'yi göreceksiniz:

```
exp://192.168.1.100:8081
```

Bu URL'yi paylaşarak aynı ağdaki başkaları da test edebilir.

## 📝 Notlar

- İlk başlatmada bağımlılıklar yüklenecek (birkaç dakika sürebilir)
- QR kod her başlatmada yenilenir
- Web'de bazı native özellikler çalışmayabilir
- Gerçek cihaz için bilgisayar ve telefon aynı Wi-Fi ağında olmalı

## 🎯 Sonraki Adımlar

Production build için:

- [EXPO_PUBLISH.md](EXPO_PUBLISH.md) dosyasına bakın
- EAS Build kullanarak native build alın
- App Store / Google Play'e yükleyin
