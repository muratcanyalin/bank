# Expo Publish Rehberi

## Expo'da Canlı Görüntüleme

### 1. Expo CLI Kurulumu

```bash
npm install -g expo-cli
```

veya

```bash
npm install -g @expo/cli
```

### 2. Expo Hesabı Oluşturma

1. https://expo.dev adresine gidin
2. Hesap oluşturun veya giriş yapın
3. Expo CLI ile giriş yapın:

```bash
npx expo login
```

### 3. Projeyi Başlatma

```bash
cd mobile
npm install
npx expo start
```

### 4. Expo Go ile Test

1. Telefonunuza **Expo Go** uygulamasını indirin:

   - iOS: App Store
   - Android: Google Play Store

2. QR kodu tarayın:
   - iOS: Camera app ile
   - Android: Expo Go app ile

### 5. Web'de Canlı Görüntüleme

```bash
npx expo start --web
```

Tarayıcıda otomatik açılacak.

### 6. Expo Publish (EAS Build - Önerilen)

#### EAS CLI Kurulumu

```bash
npm install -g eas-cli
```

#### EAS Hesabına Giriş

```bash
eas login
```

#### EAS Build Yapılandırması

```bash
cd mobile
eas build:configure
```

Bu komut `eas.json` dosyası oluşturur.

#### Development Build

```bash
eas build --profile development --platform android
# veya
eas build --profile development --platform ios
```

#### Production Build

```bash
eas build --profile production --platform android
# veya
eas build --profile production --platform ios
```

### 7. Expo Updates (OTA Updates)

Kod değişikliklerini uygulamayı yeniden build etmeden yayınlamak için:

```bash
eas update --branch production --message "Bug fixes"
```

### 8. Expo Snack (Hızlı Test)

1. https://snack.expo.dev adresine gidin
2. Projenizi yükleyin
3. Canlı olarak test edin

### 9. Environment Variables

`.env` dosyası oluşturun:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**Not:** Gerçek cihaz için bilgisayarınızın IP adresini kullanın:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

### 10. Hızlı Başlangıç

```bash
# 1. Bağımlılıkları yükle
cd mobile
npm install

# 2. Expo'yu başlat
npx expo start

# 3. QR kodu tarayın veya web'de açın
# Web için: npx expo start --web
```

### 11. Sorun Giderme

#### Metro bundler hatası

```bash
npx expo start --clear
```

#### Cache temizleme

```bash
npx expo start -c
```

#### Port değiştirme

```bash
npx expo start --port 8081
```

### 12. Production Build için

1. `app.json` dosyasını güncelleyin:

   - `version` numarasını artırın
   - `bundleIdentifier` / `package` ayarlarını yapın

2. EAS Build ile build alın:

```bash
eas build --platform all
```

3. App Store / Google Play'e yükleyin

### 13. Canlı URL

Expo Go ile test ederken, uygulama şu URL'de çalışır:

```
exp://192.168.1.100:8081
```

Bu URL'yi paylaşarak başkaları da test edebilir (aynı ağda olmalılar).

### 14. Expo Dev Tools

Expo başladığında:

- `w` - Web'de aç
- `a` - Android emulator'de aç
- `i` - iOS simulator'de aç
- `r` - Reload
- `m` - Dev menu aç

### Notlar

- Expo Go ile bazı native modüller çalışmayabilir
- Production için EAS Build kullanın
- Environment variables `EXPO_PUBLIC_` ile başlamalı
- Gerçek cihaz için bilgisayarınızın IP adresini kullanın
