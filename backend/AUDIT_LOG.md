# Audit Log System

## Genel Bakış

Tüm sistem aktiviteleri audit log sistemine kaydedilir. Bu sistem güvenlik, uyumluluk ve sorun giderme için kritik öneme sahiptir.

## Kaydedilen Olaylar

### 1. Authentication Events
- ✅ **LOGIN** - Başarılı/başarısız giriş denemeleri
- ✅ **LOGOUT** - Çıkış işlemleri
- ✅ **REGISTER** - Yeni kullanıcı kayıtları
- ✅ **MFA_VERIFY** - MFA doğrulamaları

### 2. Authorization Events
- ✅ **PERMISSION_DENIED** - İzin reddedildi
- ✅ **ROLE_DENIED** - Rol yetersiz
- ✅ **ABAC_DENIED** - ABAC policy ihlali
- ✅ **ZERO_TRUST_BLOCK** - Zero-Trust engelleme

### 3. Customer Data Access
- ✅ **CUSTOMER_VIEW** - Müşteri verisi görüntülendi
- ✅ **CUSTOMER_MODIFY** - Müşteri verisi değiştirildi
- ✅ **CUSTOMER_LIST** - Müşteri listesi görüntülendi

### 4. Banking Operations
- ✅ **TRANSFER** - Para transferi
- ✅ **ACCOUNT_CREATE** - Hesap oluşturma
- ✅ **ACCOUNT_UPDATE** - Hesap güncelleme

### 5. Security Events
- ✅ **RISK_ASSESSMENT** - Risk değerlendirmesi
- ✅ **JIT_ACCESS_REQUEST** - JIT erişim talebi
- ✅ **JIT_ACCESS_USED** - JIT erişim kullanımı

### 6. Employee Activities
- ✅ **EMPLOYEE_*** - Çalışan aktiviteleri

## Audit Log Service

Merkezi audit log servisi:

```typescript
import { AuditLogService } from './services/auditLog.service';

// Login log
await AuditLogService.logLogin(
  userId,
  'SUCCESS',
  ipAddress,
  userAgent,
  deviceInfo
);

// Customer access log
await AuditLogService.logCustomerAccess(
  employeeId,
  customerId,
  'VIEW',
  ipAddress,
  userAgent,
  deviceInfo
);

// Transfer log
await AuditLogService.logTransfer(
  userId,
  transactionId,
  amount,
  fromAccountId,
  toAccountId,
  'SUCCESS',
  ipAddress,
  userAgent,
  deviceInfo
);
```

## API Endpoints

### Get Audit Logs
```bash
GET /api/audit-logs
?userId=xxx
&action=LOGIN
&resource=customer
&status=SUCCESS
&startDate=2024-01-01
&endDate=2024-01-31
&page=1
&limit=50
```

**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

### Get Audit Statistics
```bash
GET /api/audit-logs/stats
?startDate=2024-01-01
&endDate=2024-01-31
```

**Response:**
```json
{
  "summary": {
    "total": 10000,
    "success": 9500,
    "failed": 400,
    "blocked": 100
  },
  "actions": {
    "loginAttempts": 5000,
    "transfers": 2000,
    "customerAccess": 500
  },
  "topActions": [
    { "action": "LOGIN", "count": 5000 },
    { "action": "TRANSFER", "count": 2000 }
  ],
  "security": {
    "failedLoginByIP": [
      { "ipAddress": "192.168.1.100", "count": 50 }
    ]
  }
}
```

### Get My Audit Logs
```bash
GET /api/audit-logs/me
?action=LOGIN
&limit=20
```

Kullanıcının kendi aktivitelerini görüntüler.

### Get Customer Access Logs
```bash
GET /api/audit-logs/customer-access
?customerId=xxx
&employeeId=yyy
&startDate=2024-01-01
&endDate=2024-01-31
```

Çalışanların müşteri verilerine erişim logları.

### Get Transfer Logs (with Fraud Detection)
```bash
GET /api/audit-logs/transfers
?userId=xxx
&minAmount=10000
&status=SUCCESS
```

Transfer logları ve fraud detection göstergeleri.

**Response:**
```json
{
  "logs": [
    {
      "id": "...",
      "action": "TRANSFER",
      "status": "SUCCESS",
      "metadata": {
        "amount": 50000,
        "riskScore": 45
      },
      "fraudIndicators": [
        "High-value transfer",
        "High risk score"
      ]
    }
  ]
}
```

## Fraud Detection Indicators

Transfer loglarında otomatik fraud detection:

- 🔴 **High-value transfer** - 100,000+ TRY
- 🔴 **High risk score** - Risk skoru > 70
- 🔴 **Blocked by security** - Güvenlik tarafından engellendi
- 🟡 **Private IP (possible VPN)** - VPN/proxy kullanımı şüphesi

## Permissions

- `audit:read` - Audit logları görüntüleme (EMPLOYEE, ADMIN)
- Kullanıcılar kendi loglarını görüntüleyebilir (özel permission gerekmez)

## Best Practices

1. **Tüm kritik işlemleri loglayın**
2. **Metadata'ya yeterli context ekleyin**
3. **Log retention policy belirleyin** (örnek: 1 yıl)
4. **Düzenli log analizi yapın**
5. **Anormal aktiviteleri izleyin**
6. **Compliance gereksinimlerini karşılayın** (GDPR, PCI-DSS, vb.)

## Log Retention

Production'da log retention policy uygulanmalı:

```sql
-- Örnek: 1 yıldan eski logları arşivle
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Compliance

Audit log sistemi şu compliance gereksinimlerini karşılar:

- ✅ **GDPR** - Veri erişim kayıtları
- ✅ **PCI-DSS** - Finansal işlem logları
- ✅ **SOX** - Finansal raporlama uyumluluğu
- ✅ **ISO 27001** - Bilgi güvenliği yönetimi


