# Banking Backend API

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Environment Variables

`backend` klasöründe `.env` dosyası oluşturun:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/banking_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MFA
MFA_ISSUER="Mini Banking Platform"

# CORS
FRONTEND_URL=http://localhost:3000
MOBILE_URL=http://localhost:19006
```

### 3. PostgreSQL Veritabanı Oluşturun

```bash
createdb banking_db
```

veya PostgreSQL CLI'da:

```sql
CREATE DATABASE banking_db;
```

### 4. Prisma Migration

```bash
# Prisma Client oluştur
npm run prisma:generate

# Migration çalıştır
npm run prisma:migrate
```

### 5. Seed Database (Roles & Permissions)

```bash
npm run seed
```

Bu komut şunları oluşturur:
- **Roles**: CUSTOMER, EMPLOYEE, ADMIN
- **Permissions**: account:read, transfer:create, customer:view, vb.
- **Role-Permission mappings**: Her role için uygun izinler

### 6. Development Server

```bash
npm run dev
```

Server `http://localhost:3001` adresinde çalışacak.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Kullanıcı bilgileri

### MFA
- `POST /api/mfa/generate` - MFA secret oluştur
- `POST /api/mfa/verify-enable` - MFA'yı aktifleştir
- `POST /api/mfa/verify-login` - MFA ile giriş
- `POST /api/mfa/disable` - MFA'yı kapat

### Accounts (RBAC Protected)
- `GET /api/accounts` - Kullanıcının hesaplarını listele (account:read)
- `GET /api/accounts/:id` - Hesap detayları (ABAC - ownership check)
- `POST /api/accounts` - Yeni hesap oluştur (account:create)

### Customers (Employee Only - RBAC Protected)
- `GET /api/customers` - Tüm müşterileri listele (customer:list - EMPLOYEE only)
- `GET /api/customers/:id` - Müşteri detayları (customer:view - EMPLOYEE only)
- `PATCH /api/customers/:id` - Müşteri bilgilerini güncelle (customer:modify - EMPLOYEE only)

## RBAC & ABAC

### Roles
- **CUSTOMER**: Normal müşteri, kendi hesaplarını yönetebilir
- **EMPLOYEE**: Çalışan, müşteri verilerini görüntüleyebilir
- **ADMIN**: Tam yetki

### Permissions
- `account:read` - Hesap görüntüleme
- `account:create` - Hesap oluşturma
- `transfer:create` - Para transferi
- `customer:view` - Müşteri görüntüleme (EMPLOYEE)
- `customer:modify` - Müşteri düzenleme (EMPLOYEE)
- `customer:list` - Müşteri listeleme (EMPLOYEE)
- `admin:all` - Tüm yetkiler (ADMIN)

### ABAC Policies
- Kullanıcılar sadece kendi hesaplarını görebilir (sahip kontrolü)
- Çalışanlar müşteri verilerini görebilir (customer:view permission ile)
- Yüksek tutarlı transferler sadece iş saatlerinde yapılabilir (örnek policy)

## Prisma Studio

Veritabanını görselleştirmek için:

```bash
npm run prisma:studio
```
