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

## Yeni Özellikler

### 🎯 İşlem Geçmişi
- **Filtreleme**: İşlem türü, durum ve tarih aralığına göre filtreleme
- **Export**: PDF formatında işlem geçmişi export etme
- **Dekont**: Her işlem için dekont alma ve PDF indirme

### 💳 Faturalar
- **Sorgulama**: Fatura sorgulama ve görüntüleme
- **Ödeme**: Fatura ödeme işlemleri
- **Otomatik Ödeme**: Otomatik ödeme talimatı oluşturma ve yönetme
- **Kalıcılık**: Faturalar localStorage'da saklanır (sayfa yenilendiğinde korunur)

### 📊 Dashboard
- **Şube Bilgileri**: Hesaplarda şube bilgileri gösterimi

### 👥 Çalışan Paneli
- **Müşteri Yönetimi**: Müşteri listesi ve detayları
- **İstatistikler**: Toplam müşteri, bakiye ve işlem istatistikleri

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

### Rate limiting hatası
Çok fazla istek yapıldığında rate limiting devreye girer. Birkaç dakika bekleyip tekrar deneyin.

## Kullanım İpuçları

### İşlem Geçmişi
1. Filtreleme butonuna tıklayın
2. İstediğiniz kriterleri seçin
3. Export butonu ile PDF indirin
4. Her işlem için "Dekont" butonuna tıklayarak dekont alın

### Faturalar
1. "Yeni Fatura Sorgula" butonuna tıklayın
2. Fatura bilgilerini girin ve sorgulayın
3. Ödeme yapmak için "Öde" butonuna tıklayın
4. Otomatik ödeme için "Otomatik Ödeme" butonuna tıklayın

### Otomatik Ödeme Talimatı
1. "Otomatik Ödeme" butonuna tıklayın
2. Fatura ve hesap seçin
3. Talimatı aktifleştirin
4. İstediğiniz zaman pasifleştirebilir veya silebilirsiniz
