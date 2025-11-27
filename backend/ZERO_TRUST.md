# Zero-Trust Security Layer

## Genel Bakış

Zero-Trust güvenlik yaklaşımı "Never Trust, Always Verify" prensibine dayanır. Bu sistemde her istek, kullanıcının kimliği, cihazı, konumu ve risk skoru gibi birden fazla faktörle değerlendirilir.

## Özellikler

### 1. Multi-Layer Verification

Her istek şu kontrollerden geçer:
- ✅ Authentication (JWT token)
- ✅ Authorization (RBAC/ABAC)
- ✅ Device fingerprint verification
- ✅ IP restrictions
- ✅ Risk scoring
- ✅ Session validity

### 2. Device Fingerprinting

Her cihaz benzersiz bir fingerprint ile tanımlanır:
- User-Agent
- Accept-Language
- Accept-Encoding
- Diğer HTTP headers

**Kullanım:**
```typescript
import { generateDeviceFingerprint } from './utils/deviceFingerprint';

const fingerprint = generateDeviceFingerprint(req);
```

### 3. Risk Scoring

Her işlem için risk skoru hesaplanır (0-100):

**Risk Faktörleri:**
- ⏰ Unusual time of day (gece saatleri)
- 📱 New device detection
- ❌ Recent failed login attempts
- 💰 High-value transactions
- 🌐 New IP address
- ⚡ Rapid successive actions
- 🔒 Sensitive actions (customer data access)

**Risk Seviyeleri:**
- **0-39**: ALLOW - Normal işlem
- **40-69**: REVIEW - İnceleme gerekli
- **70-100**: BLOCK - Engellendi

**Kullanım:**
```typescript
import { calculateRiskScore } from './utils/riskScoring';

const riskScore = await calculateRiskScore({
  userId,
  action: 'TRANSFER',
  resource: 'transaction',
  ipAddress,
  deviceFingerprint,
  timeOfDay: new Date().getHours(),
  amount: 50000,
});
```

### 4. IP Restrictions

IP adresi kontrolü:
- Blacklist kontrolü
- Whitelist kontrolü (opsiyonel)
- VPN/Proxy tespiti

**Environment Variables:**
```env
BLACKLISTED_IPS=192.168.1.100,10.0.0.50
WHITELISTED_IPS=203.0.113.0/24
```

### 5. Just-In-Time (JIT) Access

Geçici erişim izni sistemi. Çalışanlar belirli bir görev için sınırlı süreli erişim talep edebilir.

**Örnek Kullanım:**
```bash
# JIT access talep et
POST /api/jit/request
{
  "resource": "customer",
  "resourceId": "customer-123",
  "action": "view",
  "reason": "Customer support ticket #456",
  "duration": 30  # minutes
}

# JIT access kullan
POST /api/jit/use
{
  "token": "jit-token-here",
  "resource": "customer",
  "resourceId": "customer-123",
  "action": "view"
}
```

## Middleware Kullanımı

### Zero-Trust Middleware

```typescript
import { zeroTrustVerify } from './middleware/zeroTrust';

// Basit kullanım
router.post('/transfer', 
  authenticate,
  requirePermission('transfer:create'),
  zeroTrustVerify(),
  createTransfer
);

// Gelişmiş kullanım
router.get('/admin/users',
  authenticate,
  requireRole('ADMIN'),
  zeroTrustVerify({
    requireMFA: true,
    minRiskScore: 30,
    allowedRoles: ['ADMIN'],
  }),
  listUsers
);
```

### Options

- `requireMFA`: MFA zorunlu mu?
- `minRiskScore`: Minimum risk skoru (yüksek = daha sıkı)
- `allowedRoles`: İzin verilen roller

## Risk Scoring Örnekleri

### Düşük Risk (Score: 15)
- Normal saatlerde (9-17)
- Bilinen cihaz
- Bilinen IP
- Normal tutar

### Orta Risk (Score: 45)
- Yeni cihaz
- Yeni IP
- Yüksek tutar

### Yüksek Risk (Score: 75)
- Gece saatleri
- Yeni cihaz
- Yeni IP
- Son başarısız girişler
- Çok yüksek tutar

## Audit Logging

Tüm Zero-Trust kontrolleri audit log'a kaydedilir:

```typescript
{
  action: 'RISK_ASSESSMENT',
  status: 'SUCCESS' | 'BLOCKED',
  metadata: {
    riskScore: 45,
    factors: ['New device detected', 'High-value transaction'],
    recommendation: 'REVIEW'
  }
}
```

## Best Practices

1. **Her zaman risk skorunu kontrol edin**
2. **Yüksek riskli işlemler için ek doğrulama isteyin**
3. **Device fingerprint'i session'da saklayın**
4. **IP restrictions'ı düzenli güncelleyin**
5. **JIT access'leri kısa süreli tutun (max 1 saat)**
6. **Tüm blokları audit log'a kaydedin**

## Güvenlik Notları

⚠️ **Production'da:**
- Device fingerprint'i daha sofistike algoritmalarla hesaplayın
- IP reputation servisleri kullanın (MaxMind, AbuseIPDB)
- Machine learning ile risk skorunu iyileştirin
- Rate limiting ekleyin
- CAPTCHA yüksek riskli işlemlerde


