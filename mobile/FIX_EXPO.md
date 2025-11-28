# Expo Başlatma Sorunu Çözümü

## Sorun
```
Error: Cannot find module 'react-native/package.json'
Error: Cannot find module 'C:\Users\MROOT\Desktop\bank\node_modules\expo\bin\cli'
```

## Çözüm

### 1. Root'taki Expo Paketlerini Temizle

```powershell
cd C:\Users\MROOT\Desktop\bank
Get-ChildItem node_modules -Directory | Where-Object { $_.Name -like "*expo*" -or $_.Name -like "*react-native*" } | Remove-Item -Recurse -Force
```

### 2. Mobile Klasöründe Expo'yu Yükle

```powershell
cd C:\Users\MROOT\Desktop\bank\mobile
npm install
```

### 3. Expo'yu Başlat

**Yöntem 1: npm script (Önerilen)**
```powershell
cd C:\Users\MROOT\Desktop\bank\mobile
npm run start
```

**Yöntem 2: Doğrudan expo komutu**
```powershell
cd C:\Users\MROOT\Desktop\bank\mobile
.\node_modules\.bin\expo.cmd start
```

**Yöntem 3: npx ile (mobile klasöründen)**
```powershell
cd C:\Users\MROOT\Desktop\bank\mobile
npx expo start
```

**Yöntem 4: Root'tan npm script**
```powershell
cd C:\Users\MROOT\Desktop\bank
npm run dev:mobile
```

## Önemli Notlar

1. **Her zaman mobile klasöründen başlatın** - Root'tan değil!
2. Root'taki expo paketleri sorun yaratabilir - temizleyin
3. Mobile klasöründe `node_modules\expo` olmalı
4. Mobile klasöründe `node_modules\react-native` olmalı

## Sorun Devam Ederse

1. **Cache temizle:**
```powershell
cd C:\Users\MROOT\Desktop\bank\mobile
npx expo start --clear
```

2. **Node modules yeniden yükle:**
```powershell
cd C:\Users\MROOT\Desktop\bank\mobile
Remove-Item -Recurse -Force node_modules
npm install
npm run start
```

3. **Expo CLI güncelle:**
```powershell
npm install -g @expo/cli@latest
cd C:\Users\MROOT\Desktop\bank\mobile
npm run start
```

## Başarılı Başlatma

Expo başarıyla başladığında şunları göreceksiniz:
- QR kod
- Metro bundler çıktısı
- "Press w │ open web" gibi seçenekler

