# 🏦 Mini Banking Platform

Bu proje; bankacılık sistemlerinin temel bileşenlerini öğrenmek, güvenlik mimarisini anlamak ve profesyonel bir fintech mimarisinin mini versiyonunu oluşturmaya yönelik bir çalışmadır.

## 🎉 Proje Durumu

**✅ TÜM FAZLAR TAMAMLANDI!**

- ✅ Phase 1: Project Setup
- ✅ Phase 2: UI/UX Design
- ✅ Phase 3: Authentication System
- ✅ Phase 4: RBAC & ABAC Authorization
- ✅ Phase 5: Zero-Trust Security Layer
- ✅ Phase 6: Audit Log System
- ✅ Phase 7: Banking Core (Mock)
- ✅ Phase 8: Mobile App (React Native)
- ✅ Phase 9: Hardening & Security Tests

## 🚀 Teknoloji Stack

### Backend
- **Framework**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis (opsiyonel)
- **Authentication**: JWT + Refresh Token + MFA (TOTP)
- **Security**: RBAC, ABAC, Zero-Trust, Rate Limiting

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (ready)
- **Forms**: React Hook Form + Zod

### Mobile
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State**: Context API + AsyncStorage

## 📁 Proje Yapısı

```
bank/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── prisma/
├── frontend/         # Next.js Web Uygulaması
│   ├── app/
│   ├── components/
│   └── ...
├── mobile/           # React Native Mobil Uygulama
│   ├── src/
│   │   ├── screens/
│   │   ├── services/
│   │   └── context/
│   └── ...
└── package.json      # Monorepo workspace
```

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (opsiyonel)
- npm veya yarn

### Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm run install:all
```

2. **PostgreSQL veritabanı oluşturun:**
```bash
createdb banking_db
```

3. **Backend yapılandırması:**
```bash
cd backend
# .env dosyası oluşturun (backend/.env.example'a bakın)
npm run prisma:generate
npm run prisma:migrate
npm run seed  # Roles & Permissions
```

4. **Development server'ları başlatın:**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Terminal 3 - Mobile (opsiyonel)
cd mobile && npm start
```

## 📚 Dokümantasyon

- [Backend README](backend/README.md) - Backend API dokümantasyonu
- [Security Guide](backend/SECURITY.md) - Güvenlik rehberi
- [Zero-Trust](backend/ZERO_TRUST.md) - Zero-Trust güvenlik katmanı
- [Audit Log](backend/AUDIT_LOG.md) - Audit log sistemi
- [Banking Core](backend/BANKING_CORE.md) - Bankacılık işlemleri
- [Mobile README](mobile/README.md) - Mobil uygulama rehberi
- [Setup Guide](SETUP.md) - Detaylı kurulum rehberi
- [Quick Start](START.md) - Hızlı başlangıç rehberi

## 🔐 Güvenlik Özellikleri

### Authentication & Authorization
- ✅ JWT Access Token (15 dk)
- ✅ Refresh Token (7 gün)
- ✅ MFA (TOTP)
- ✅ RBAC (Role-Based Access Control)
- ✅ ABAC (Attribute-Based Access Control)
- ✅ Zero-Trust Security Layer

### Security Hardening
- ✅ Rate Limiting (IP & User-based)
- ✅ Anti-Bruteforce Protection
- ✅ SQL Injection Prevention (Prisma ORM)
- ✅ XSS Protection (Input Sanitization)
- ✅ CSRF Protection
- ✅ Security Headers (Helmet.js)
- ✅ Input Validation (Express-validator)

### Fraud Detection
- ✅ Risk Scoring (0-100)
- ✅ Device Fingerprinting
- ✅ IP Restrictions
- ✅ Transfer Limits
- ✅ Suspicious Activity Detection

### Audit & Compliance
- ✅ Comprehensive Audit Logging
- ✅ GDPR Compliance
- ✅ PCI-DSS Ready
- ✅ Security Event Tracking

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Kullanıcı bilgileri

### MFA
- `POST /api/mfa/generate` - MFA secret oluştur
- `POST /api/mfa/verify-enable` - MFA aktifleştir
- `POST /api/mfa/verify-login` - MFA ile giriş
- `POST /api/mfa/disable` - MFA kapat

### Accounts
- `GET /api/accounts` - Hesapları listele
- `GET /api/accounts/:id` - Hesap detayları
- `POST /api/accounts` - Yeni hesap oluştur
- `PATCH /api/accounts/:id` - Hesap güncelle
- `POST /api/accounts/:id/deactivate` - Hesap deaktif et

### Balances
- `GET /api/balances` - Tüm bakiyeler
- `GET /api/balances/account/:id` - Hesap bakiyesi
- `GET /api/balances/account/:id/summary` - Hesap özeti

### Transactions
- `GET /api/transactions` - İşlem geçmişi (filtreleme destekli)
- `GET /api/transactions/:id` - İşlem detayları
- `POST /api/transactions/:id/cancel` - İşlem iptal et

### Transfers
- `POST /api/transfers` - Para transferi

### Bills
- `GET /api/bills` - Kullanıcının faturaları
- `GET /api/bills/providers` - Fatura sağlayıcıları
- `POST /api/bills/query` - Fatura sorgula

### Customers (Employee Only)
- `GET /api/customers` - Müşteri listesi
- `GET /api/customers/:id` - Müşteri detayları
- `PATCH /api/customers/:id` - Müşteri güncelle

### Audit Logs
- `GET /api/audit-logs` - Audit logları
- `GET /api/audit-logs/stats` - İstatistikler
- `GET /api/audit-logs/me` - Kullanıcının logları
- `GET /api/audit-logs/customer-access` - Müşteri erişim logları
- `GET /api/audit-logs/transfers` - Transfer logları

### JIT Access
- `POST /api/jit/request` - JIT access talep et
- `POST /api/jit/use` - JIT access kullan
- `POST /api/jit/revoke` - JIT access iptal et

## 🎯 Özellikler

### Web Application
- ✅ Modern, responsive UI
- ✅ Dashboard (şube bilgileri ile)
- ✅ Account Management
- ✅ Money Transfer
- ✅ Transaction History (filtreleme, export, dekont)
- ✅ Bills Management (otomatik ödeme talimatı)
- ✅ Employee Panel

### Transaction History Features
- ✅ Gelişmiş filtreleme (tür, durum, tarih aralığı)
- ✅ Export özelliği (PDF)
- ✅ Her işlem için dekont alma
- ✅ Önizleme penceresi

### Bills Management Features
- ✅ Fatura sorgulama
- ✅ Fatura ödeme
- ✅ Otomatik ödeme talimatı sistemi
- ✅ localStorage ile kalıcılık
- ✅ Otomatik ödeme yönetimi (aktif/pasif)

### Mobile Application
- ✅ Native mobile experience
- ✅ Login & Authentication
- ✅ Dashboard
- ✅ Transfer
- ✅ Transaction History
- ✅ Pull to Refresh

### Security Features
- ✅ Multi-layer security
- ✅ Real-time fraud detection
- ✅ Comprehensive audit logging
- ✅ Zero-Trust architecture
- ✅ Rate limiting & anti-bruteforce
- ✅ İyileştirilmiş hata mesajları

## 🧪 Testing

### Security Testing
- Penetration testing checklist (see `backend/SECURITY.md`)
- OWASP Top 10 compliance
- API security testing
- Authentication & authorization testing

### Manual Testing
```bash
# Backend health check
curl http://localhost:3001/health

# Database connection test
curl http://localhost:3001/api/test-db
```

## 📝 Son Güncellemeler

### v1.1.0 (Son Güncellemeler)
- ✅ Dashboard'a şube bilgileri eklendi
- ✅ İşlem geçmişine filtreleme özelliği eklendi
- ✅ İşlem geçmişine export (PDF) özelliği eklendi
- ✅ Her işlem için dekont alma özelliği eklendi
- ✅ Faturalar sayfasına otomatik ödeme talimatı sistemi eklendi
- ✅ Faturalar localStorage ile kalıcı hale getirildi
- ✅ Fatura ödeme hesap seçimi düzeltildi
- ✅ Çalışan paneli veri yapısı düzeltildi
- ✅ Rate limiting hata mesajları iyileştirildi

## 📝 Lisans

Bu proje eğitim amaçlıdır.

## 🙏 Katkıda Bulunma

Bu bir öğrenme projesidir. İyileştirme önerileri ve feedback'ler memnuniyetle karşılanır!

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu bir mock bankacılık sistemidir. Gerçek para işlemleri yapmaz. Production kullanımı için ek güvenlik önlemleri ve compliance gereksinimleri karşılanmalıdır.
