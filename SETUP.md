# 🚀 Kurulum Rehberi

## Gereksinimler

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (opsiyonel, Phase 9 için)
- npm veya yarn

## Adım Adım Kurulum

### 1. Projeyi Klonlayın / İndirin

```bash
cd bank
```

### 2. Tüm Bağımlılıkları Yükleyin

```bash
npm run install:all
```

veya manuel olarak:

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mobile && npm install && cd ..
```

### 3. PostgreSQL Veritabanı Oluşturun

```bash
# Windows (PowerShell)
createdb banking_db

# veya PostgreSQL CLI'da
psql -U postgres
CREATE DATABASE banking_db;
\q
```

### 4. Backend Yapılandırması

`backend` klasöründe `.env` dosyası oluşturun:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/banking_db?schema=public"

# JWT
JWT_SECRET="change-this-to-a-random-secret-key-min-32-chars"
JWT_REFRESH_SECRET="change-this-to-another-random-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Redis (opsiyonel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MFA
MFA_ISSUER="Mini Banking Platform"

# CORS
FRONTEND_URL=http://localhost:3000
MOBILE_URL=http://localhost:19006
```

**ÖNEMLİ**: `JWT_SECRET` ve `JWT_REFRESH_SECRET` değerlerini güvenli, rastgele değerlerle değiştirin!

### 5. Prisma Migration

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 6. Seed Database (Roles & Permissions)

```bash
cd backend
npm run seed
```

Bu komut şunları oluşturur:
- **Roles**: CUSTOMER, EMPLOYEE, ADMIN
- **Permissions**: account:read, transfer:create, customer:view, vb.
- **Role-Permission mappings**: Her role için uygun izinler

### 7. Frontend Yapılandırması

`frontend` klasöründe `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 8. Mobile Yapılandırması (Opsiyonel)

`mobile` klasöründe `.env` dosyası oluşturun:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**Not:** Emulator/Simulator için `localhost` kullanabilirsiniz.
Gerçek cihaz için bilgisayarınızın IP adresini kullanın (örn: `http://192.168.1.100:3001`).

### 9. Uygulamaları Başlatın

**Terminal 1 - Backend:**
```bash
npm run dev:backend
# veya
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
# veya
cd frontend && npm run dev
```

**Terminal 3 - Mobile (opsiyonel):**
```bash
npm run dev:mobile
# veya
cd mobile && npm start
```

## Test

- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000
- Database Test: http://localhost:3001/api/test-db

## Yeni Özellikler

### İşlem Geçmişi
- ✅ Gelişmiş filtreleme (tür, durum, tarih aralığı)
- ✅ Export özelliği (PDF formatında)
- ✅ Her işlem için dekont alma
- ✅ Önizleme penceresi

### Faturalar
- ✅ Fatura sorgulama ve ödeme
- ✅ Otomatik ödeme talimatı sistemi
- ✅ localStorage ile kalıcılık (sayfa yenilendiğinde faturalar korunur)
- ✅ Otomatik ödeme yönetimi (aktif/pasif)

### Dashboard
- ✅ Hesaplarda şube bilgileri gösterimi

## Sorun Giderme

### PostgreSQL Bağlantı Hatası

- PostgreSQL servisinin çalıştığından emin olun
- `DATABASE_URL` içindeki kullanıcı adı ve şifrenin doğru olduğunu kontrol edin
- Veritabanının oluşturulduğunu doğrulayın

### Port Zaten Kullanılıyor

- Backend için farklı bir PORT değeri kullanın (`.env` dosyasında)
- Frontend için Next.js otomatik olarak farklı bir port seçecektir

### Prisma Migration Hatası

```bash
cd backend
npx prisma migrate reset  # Dikkat: Tüm verileri siler!
npx prisma migrate dev
```

### Rate Limiting Hatası

Eğer "Please try again in 15 minutes" hatası alıyorsanız:
- Bu güvenlik önlemi normaldir
- Birkaç dakika bekleyip tekrar deneyin
- Hata mesajları iyileştirilmiştir ve daha açıklayıcıdır

## Sonraki Adımlar

Tüm fazlar tamamlandı! Şimdi şu özellikleri kullanabilirsiniz:
- ✅ Dashboard (şube bilgileri ile)
- ✅ İşlem geçmişi (filtreleme, export, dekont)
- ✅ Faturalar (otomatik ödeme talimatı)
- ✅ Çalışan paneli
- ✅ Güvenlik özellikleri
