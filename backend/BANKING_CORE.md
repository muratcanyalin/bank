# Banking Core (Mock)

## Genel Bakış

Bankacılık işlemlerinin temel fonksiyonlarını içeren mock sistem. Gerçek bankacılık sistemlerinin temel özelliklerini simüle eder.

## Özellikler

### 1. Account Management

#### Create Account
```bash
POST /api/accounts
Authorization: Bearer <token>
{
  "accountType": "CHECKING" | "SAVINGS" | "CREDIT",
  "initialBalance": 0
}
```

#### Update Account
```bash
PATCH /api/accounts/:id
Authorization: Bearer <token>
{
  "isActive": true
}
```

#### Deactivate Account
```bash
POST /api/accounts/:id/deactivate
Authorization: Bearer <token>
```

**Not:** Hesapta bakiye varsa deaktivasyon yapılamaz.

### 2. Balance Management

#### Get Account Balance
```bash
GET /api/balances/account/:id
Authorization: Bearer <token>
```

#### Get Account Summary
```bash
GET /api/balances/account/:id/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "account": {...},
  "recentTransactions": [...],
  "today": {
    "incoming": 1000,
    "outgoing": 500,
    "net": 500,
    "transactionCount": 5
  },
  "transferLimits": {
    "daily": { "used": 10000, "limit": 50000, "remaining": 40000 },
    "monthly": { "used": 50000, "limit": 500000, "remaining": 450000 },
    "singleTransaction": { "limit": 100000 },
    "transactionsToday": 5,
    "maxTransactionsPerDay": 20
  }
}
```

#### Get All Balances
```bash
GET /api/balances
Authorization: Bearer <token>
```

### 3. Transaction Management

#### Get Transaction History
```bash
GET /api/transactions
?accountId=xxx
&type=TRANSFER
&status=COMPLETED
&startDate=2024-01-01
&endDate=2024-01-31
&minAmount=1000
&maxAmount=10000
&page=1
&limit=50
```

#### Get Transaction Details
```bash
GET /api/transactions/:id
Authorization: Bearer <token>
```

#### Cancel Transaction
```bash
POST /api/transactions/:id/cancel
Authorization: Bearer <token>
```

**Not:** Sadece PENDING durumundaki işlemler iptal edilebilir.

### 4. Transfer Limits

**Default Limits:**
- Daily Limit: 50,000 TRY
- Monthly Limit: 500,000 TRY
- Single Transaction Limit: 100,000 TRY
- Max Transactions Per Day: 20

**Limit Check:**
Transfer yapılmadan önce otomatik olarak kontrol edilir:
- Günlük limit
- Aylık limit
- Tek işlem limiti
- Günlük işlem sayısı

### 5. Fraud Detection

**Detection Rules:**

1. **Unusually Large Amount**
   - > 100,000 TRY: MEDIUM risk
   - > 500,000 TRY: HIGH risk

2. **Rapid Successive Transfers**
   - 5+ transfer in 5 minutes: MEDIUM/HIGH risk

3. **First-Time Transfer to New Recipient**
   - First transfer to new account + amount > 10,000: MEDIUM risk

4. **Low Balance After Transfer**
   - Balance < 100 after transfer: MEDIUM risk

5. **Transfer Exceeds 90% of Balance**
   - Amount > 90% of balance: MEDIUM/HIGH risk

6. **Multiple Failed Transactions**
   - 3+ failed transactions in 1 hour: HIGH risk

7. **Unusual Time Pattern**
   - Large transfer outside business hours (6 AM - 10 PM): MEDIUM risk

**Risk Levels:**
- **LOW**: Allow
- **MEDIUM**: Review (allow but flag)
- **HIGH**: Block
- **CRITICAL**: Block immediately

### 6. Transaction Status

**Statuses:**
- `PENDING` - İşlem bekliyor
- `COMPLETED` - İşlem tamamlandı
- `FAILED` - İşlem başarısız
- `CANCELLED` - İşlem iptal edildi

**Status Flow:**
```
PENDING → COMPLETED
PENDING → FAILED
PENDING → CANCELLED
```

## API Endpoints Summary

### Accounts
- `GET /api/accounts` - List accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create account
- `PATCH /api/accounts/:id` - Update account
- `POST /api/accounts/:id/deactivate` - Deactivate account

### Balances
- `GET /api/balances` - Get all balances
- `GET /api/balances/account/:id` - Get account balance
- `GET /api/balances/account/:id/summary` - Get account summary

### Transactions
- `GET /api/transactions` - Get transaction history
- `GET /api/transactions/:id` - Get transaction details
- `POST /api/transactions/:id/cancel` - Cancel transaction

### Transfers
- `POST /api/transfers` - Create transfer (with limits & fraud detection)

## Security Features

1. **Ownership Verification**
   - Users can only access their own accounts
   - ABAC middleware enforces ownership

2. **Transfer Limits**
   - Daily, monthly, and per-transaction limits
   - Automatic limit checking

3. **Fraud Detection**
   - Real-time fraud checking
   - Risk scoring
   - Automatic blocking of high-risk transactions

4. **Audit Logging**
   - All transactions logged
   - Fraud attempts logged
   - Limit violations logged

## Best Practices

1. **Always check balance before transfer**
2. **Respect transfer limits**
3. **Monitor fraud indicators**
4. **Handle transaction statuses properly**
5. **Log all banking operations**
6. **Validate account ownership**

## Mock vs Real Banking

**This is a MOCK system:**
- ✅ Simulates basic banking operations
- ✅ Includes security features
- ✅ Has fraud detection
- ❌ NOT connected to real payment networks
- ❌ NOT handling real money
- ❌ NOT processing actual transfers

**For Production:**
- Integrate with payment gateways
- Connect to SWIFT/SEPA networks
- Real-time balance updates
- Settlement processing
- Regulatory compliance


