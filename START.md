# 🚀 Hızlı Başlangıç

## Adım 1: PostgreSQL Hazırlığı

PostgreSQL'in çalıştığından ve `banking_db` veritabanının oluşturulduğundan emin olun:

```sql
-- PostgreSQL'de çalıştırın:
CREATE DATABASE banking_db;
```

## Adım 2: Backend Kurulumu

```powershell
cd backend

# .env dosyası oluştur (veya quick-start.ps1 çalıştır)
# Sonra:
npm run prisma:generate
npm run prisma:migrate
npm run seed

# Server'ı başlat
npm run dev
```

Backend `http://localhost:3001` adresinde çalışacak.

## Adım 3: Frontend Kurulumu

Yeni bir terminal açın:

```powershell
cd frontend
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacak.

## Hızlı Test

1. Frontend: http://localhost:3000
2. Backend Health: http://localhost:3001/health
3. Database Test: http://localhost:3001/api/test-db

## Sorun Giderme

### Backend başlamıyor
- `.env` dosyası var mı kontrol edin
- PostgreSQL çalışıyor mu kontrol edin
- `DATABASE_URL` doğru mu kontrol edin

### Prisma hatası
```powershell
npm run prisma:generate
npm run prisma:migrate
```

### Port zaten kullanılıyor
`.env` dosyasında `PORT` değerini değiştirin.


