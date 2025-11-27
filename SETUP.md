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
DATABASE_URL="postgresql://postgres:password@localhost:5432/banking_db?schema=public"
JWT_SECRET="change-this-to-a-random-secret-key-min-32-chars"
JWT_REFRESH_SECRET="change-this-to-another-random-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
MFA_ISSUER="Mini Banking Platform"
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

### 6. Frontend Yapılandırması (Opsiyonel)

`frontend` klasöründe `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 7. Uygulamaları Başlatın

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

**Terminal 3 - Mobile (opsiyonel):**
```bash
npm run dev:mobile
```

## Test

- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000
- Database Test: http://localhost:3001/api/test-db

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

## Sonraki Adımlar

Phase 1 tamamlandı! Şimdi Phase 2'ye geçebilirsiniz:
- UI/UX Design
- Authentication System
- RBAC & ABAC
- vb.


