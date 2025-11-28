# Banking Mobile App

React Native + Expo ile geliştirilmiş mobil bankacılık uygulaması.

## ✨ Özellikler

- ✅ Login & Authentication
- ✅ Dashboard (Hesap özeti, şube bilgileri)
- ✅ Para Transferi
- ✅ İşlem Geçmişi (filtreleme, dekont)
- ✅ Faturalar (sorgulama, ödeme, otomatik ödeme talimatı)
- ✅ Mock Notifications
- ✅ Token Refresh
- ✅ Pull to Refresh
- ✅ localStorage ile kalıcılık

## 🚀 Hızlı Başlangıç

### Kurulum

```bash
cd mobile
npm install
```

### Development

```bash
npx expo start
```

Expo Go uygulaması ile QR kodu tarayarak test edebilirsiniz.

Detaylı bilgi için [QUICK_START.md](QUICK_START.md) dosyasına bakın.

## 📱 Yeni Özellikler (v1.0.0)

### Dashboard

- ✅ Şube bilgileri gösterimi
- ✅ Hesaplar listesi
- ✅ Hızlı işlemler menüsü
- ✅ Faturalar butonu

### İşlem Geçmişi

- ✅ Gelişmiş filtreleme (tür, durum)
- ✅ Dekont alma (PDF formatında)
- ✅ İşlem detayları modal'ı
- ✅ Pull to refresh

### Faturalar

- ✅ Fatura sorgulama
- ✅ Fatura listesi
- ✅ Fatura ödeme
- ✅ Otomatik ödeme talimatı sistemi
- ✅ AsyncStorage ile kalıcılık
- ✅ Otomatik ödeme yönetimi (aktif/pasif)

## Environment Variables

`.env` dosyası oluşturun:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**Not:** Emulator/Simulator için `localhost` kullanabilirsiniz.
Gerçek cihaz için bilgisayarınızın IP adresini kullanın (örn: `http://192.168.1.100:3001`).

## Platformlar

- **iOS**: `npm run ios` veya `npx expo start --ios`
- **Android**: `npm run android` veya `npx expo start --android`
- **Web**: `npm run web` veya `npx expo start --web`

## Ekranlar

### Login Screen

- Email/Password girişi
- MFA desteği (yakında)
- Kayıt ol linki
- Token yönetimi

### Dashboard Screen

- Toplam bakiye
- Hesaplar listesi (şube bilgileri ile)
- Hızlı işlemler
- Pull to refresh

### Transfer Screen

- Gönderen hesap seçimi
- Alıcı hesap/IBAN girişi
- Tutar ve açıklama
- Transfer onayı

### Transactions Screen

- İşlem geçmişi listesi
- **Gelişmiş filtreleme** (tür, durum)
- **Dekont alma** (PDF)
- Detay görüntüleme
- Pull to refresh

### Bills Screen

- Fatura sorgulama
- Fatura listesi
- Fatura ödeme
- Otomatik ödeme talimatı yönetimi
- AsyncStorage ile kalıcılık

## API Integration

Tüm API çağrıları `src/services/api.ts` dosyasında merkezi olarak yönetilir.

**Özellikler:**

- Otomatik token ekleme
- Token refresh handling
- Error handling
- Request/Response interceptors
- Network error handling

### API Endpoints

- `authAPI` - Authentication
- `accountAPI` - Account management
- `balanceAPI` - Balance queries
- `transactionAPI` - Transaction history (with filtering)
- `transferAPI` - Money transfers
- `billsAPI` - Bill query and payment

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
- AsyncStorage (Token & User data, Bills, Auto-pay instructions)
- Local state (React Hooks)

## Storage

### AsyncStorage Keys

- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `user` - User data
- `user_bills` - Queried bills
- `auto_pay_instructions` - Automatic payment instructions

## Güvenlik

- Token storage (AsyncStorage)
- Secure token handling
- Auto token refresh
- Network security
- Input validation

## Expo Publish

Canlı görüntüleme ve publish için:

- [QUICK_START.md](QUICK_START.md) - Hızlı başlangıç
- [EXPO_PUBLISH.md](EXPO_PUBLISH.md) - Detaylı publish rehberi

### Hızlı Publish

```bash
# Expo'yu başlat
npx expo start

# Web'de aç
npx expo start --web

# QR kodu ile Expo Go'da aç
# (QR kodu terminal'de görünecek)
```

## Build

### Development Build

```bash
eas build --profile development --platform android
```

### Production Build

```bash
eas build --profile production --platform android
```

## Testing

```bash
npm test
```

## Troubleshooting

### Metro bundler hatası

```bash
npx expo start --reset-cache
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

### Backend bağlantı hatası

- Backend'in çalıştığından emin olun (`http://localhost:3001`)
- `.env` dosyasındaki `EXPO_PUBLIC_API_URL` değerini kontrol edin
- Gerçek cihaz için IP adresini kullanın (localhost değil)

## Sonraki Adımlar

- [ ] MFA ekranı
- [ ] Account detail screen
- [ ] Transaction detail screen
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Dark mode
- [ ] İşlem geçmişi export (PDF)
- [ ] Fatura ödeme geçmişi

## Notlar

- Expo Go ile test ederken bazı native modüller çalışmayabilir
- Production build için EAS Build kullanılmalıdır
- Push notifications için Expo Push Notification servisi kullanılmalıdır
- PDF export için `expo-print` ve `expo-sharing` paketleri kullanılmaktadır

## Versiyon

**Current Version:** 1.0.0

Tüm frontend ve backend güncellemeleri mobil uygulamaya entegre edilmiştir.
