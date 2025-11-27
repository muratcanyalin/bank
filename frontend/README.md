# Banking Frontend

Next.js 14 ile geliştirilmiş modern web uygulaması.

## Kurulum

```bash
npm install
```

## Development

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Özellikler

### Dashboard
- ✅ Toplam bakiye görüntüleme
- ✅ Hesaplar listesi (şube bilgileri ile)
- ✅ Son işlemler
- ✅ Hızlı işlemler menüsü

### Hesaplar
- ✅ Hesap listesi ve detayları
- ✅ Yeni hesap oluşturma
- ✅ Hesap dondurma/açma
- ✅ Hesap kapatma (bakiye transferi ile)
- ✅ Şube bilgileri gösterimi

### İşlem Geçmişi
- ✅ Tüm işlemlerin listesi
- ✅ **Gelişmiş filtreleme** (tür, durum, tarih aralığı)
- ✅ **Export özelliği** (PDF formatında)
- ✅ **Dekont alma** (her işlem için)
- ✅ Önizleme penceresi
- ✅ İstatistikler (toplam, gelen, giden)

### Para Transferi
- ✅ Hesap seçimi
- ✅ Alıcı bilgileri
- ✅ Tutar ve açıklama
- ✅ Transfer onayı

### Faturalar
- ✅ Fatura sorgulama
- ✅ Fatura listesi
- ✅ Fatura ödeme
- ✅ **Otomatik ödeme talimatı sistemi**
- ✅ **localStorage ile kalıcılık**
- ✅ Otomatik ödeme yönetimi (aktif/pasif)

### Çalışan Paneli
- ✅ Müşteri listesi
- ✅ Müşteri arama
- ✅ İstatistikler
- ✅ Müşteri detayları

## Yeni Özellikler

### İşlem Geçmişi Geliştirmeleri

#### Filtreleme
- İşlem türüne göre filtreleme (Yatırma, Çekme, Transfer, Ödeme)
- Duruma göre filtreleme (Tamamlandı, Beklemede, Başarısız, İptal)
- Tarih aralığına göre filtreleme
- Filtreleri sıfırlama

#### Export
- Filtrelenmiş işlemleri PDF olarak export etme
- Önizleme penceresi
- Tablo formatında düzenli PDF çıktısı

#### Dekont
- Her işlem için dekont alma
- Dekont popup'ı
- PDF formatında dekont indirme
- Profesyonel dekont tasarımı

### Faturalar Geliştirmeleri

#### Otomatik Ödeme Talimatı
- Fatura için otomatik ödeme talimatı oluşturma
- Hesap seçimi
- Talimatı aktif/pasif yapma
- Talimat silme
- Talimat listesi görüntüleme

#### Kalıcılık
- Faturalar localStorage'da saklanır
- Sayfa yenilendiğinde faturalar korunur
- Otomatik ödeme talimatları da localStorage'da saklanır

#### Hesap Seçimi
- Ödeme modalında hesaplar otomatik yüklenir
- Yeterli bakiyeli hesaplar gösterilir
- Hesap seçimi düzeltildi

## Kullanım

### İşlem Geçmişi Filtreleme
1. "Filtrele" butonuna tıklayın
2. İstediğiniz kriterleri seçin
3. "Uygula" butonuna tıklayın
4. Sonuçlar filtrelenmiş olarak görüntülenir

### İşlem Geçmişi Export
1. Filtreleme yapın (opsiyonel)
2. "Export" butonuna tıklayın
3. Önizleme penceresinde kontrol edin
4. "PDF Olarak İndir" butonuna tıklayın

### Dekont Alma
1. İşlem listesinde "Dekont" butonuna tıklayın
2. Dekont popup'ında bilgileri kontrol edin
3. "PDF İndir" butonuna tıklayın

### Otomatik Ödeme Talimatı
1. "Otomatik Ödeme" butonuna tıklayın
2. Fatura ve hesap seçin
3. "Oluştur" butonuna tıklayın
4. Talimatı istediğiniz zaman aktif/pasif yapabilir veya silebilirsiniz

## Teknik Detaylar

### State Management
- React Hooks (useState, useEffect)
- Context API (Toast notifications)

### API Integration
- Merkezi API client (`lib/api.ts`)
- Error handling
- Token management

### LocalStorage
- Faturalar için kalıcılık
- Otomatik ödeme talimatları için kalıcılık

### PDF Generation
- Browser print API kullanılarak PDF oluşturma
- Özelleştirilmiş HTML template'ler

## Build

```bash
npm run build
npm start
```

## Linting

```bash
npm run lint
```
