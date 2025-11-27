# Banking Mobile App

React Native + Expo ile geliştirilmiş mobil bankacılık uygulaması.

## Özellikler

- ✅ Login & Authentication
- ✅ Dashboard (Hesap özeti)
- ✅ Para Transferi
- ✅ İşlem Geçmişi
- ✅ Mock Notifications
- ✅ Token Refresh
- ✅ Pull to Refresh

## Kurulum

```bash
cd mobile
npm install
```

## Development

```bash
npm start
```

Expo Go uygulaması ile QR kodu tarayarak test edebilirsiniz.

## Environment Variables

`.env` dosyası oluşturun:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**Not:** Emulator/Simulator için `localhost` kullanabilirsiniz.
Gerçek cihaz için bilgisayarınızın IP adresini kullanın (örn: `http://192.168.1.100:3001`).

## Platformlar

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## Ekranlar

### Login Screen
- Email/Password girişi
- MFA desteği (yakında)
- Kayıt ol linki
- Token yönetimi

### Dashboard Screen
- Toplam bakiye
- Hesaplar listesi
- Hızlı işlemler
- Pull to refresh

### Transfer Screen
- Gönderen hesap seçimi
- Alıcı hesap/IBAN girişi
- Tutar ve açıklama
- Transfer onayı

### Transactions Screen
- İşlem geçmişi listesi
- Filtreleme (yakında)
- Detay görüntüleme
- Pull to refresh

## API Integration

Tüm API çağrıları `src/services/api.ts` dosyasında merkezi olarak yönetilir.

**Özellikler:**
- Otomatik token ekleme
- Token refresh handling
- Error handling
- Request/Response interceptors
- Network error handling

## Notifications

Mock notification servisi `src/services/notifications.ts` dosyasında.

**Production'da:**
- Expo Push Notifications
- Firebase Cloud Messaging
- Apple Push Notification Service

## Navigation

React Navigation kullanılıyor:
- Stack Navigator
- Auth-based routing
- Protected screens
- Deep linking (yakında)

## State Management

- Context API (AuthContext)
- AsyncStorage (Token & User data)
- Local state (React Hooks)

## Güvenlik

- Token storage (AsyncStorage)
- Secure token handling
- Auto token refresh
- Network security

## Sonraki Adımlar

- [ ] MFA ekranı
- [ ] Account detail screen
- [ ] Transaction detail screen
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Dark mode
- [ ] İşlem geçmişi filtreleme
- [ ] Faturalar ekranı
- [ ] Otomatik ödeme yönetimi

## Build

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Testing

```bash
npm test
```

## Troubleshooting

### Metro bundler hatası
```bash
npm start -- --reset-cache
```

### Android build hatası
```bash
cd android
./gradlew clean
cd ..
```

### iOS build hatası
```bash
cd ios
pod install
cd ..
```

## Notlar

- Expo Go ile test ederken bazı native modüller çalışmayabilir
- Production build için EAS Build kullanılmalıdır
- Push notifications için Expo Push Notification servisi kullanılmalıdır
