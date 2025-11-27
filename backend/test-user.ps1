# Test Kullanıcısı Oluşturma Scripti
# Bu script database'de test kullanıcısı oluşturur

Write-Host "🧪 Test Kullanıcısı Oluşturuluyor..." -ForegroundColor Cyan

$env:Path = "C:\Program Files\PostgreSQL\15\bin;$env:Path"

# Database bağlantısını test et
$testQuery = @"
SELECT EXISTS(
    SELECT 1 FROM users WHERE email = 'test@example.com'
) as user_exists;
"@

$result = psql -U postgres -d banking_db -tAc $testQuery 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database bağlantısı başarılı" -ForegroundColor Green
    
    # Kullanıcı var mı kontrol et
    if ($result -match "t") {
        Write-Host "ℹ️  Test kullanıcısı zaten mevcut: test@example.com" -ForegroundColor Yellow
        Write-Host "   Şifre: test123" -ForegroundColor Yellow
    } else {
        Write-Host "📝 Test kullanıcısı oluşturuluyor..." -ForegroundColor Yellow
        
        # Node.js ile kullanıcı oluştur (Prisma kullanarak)
        $createUserScript = @"
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const passwordHash = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: passwordHash,
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+905551234567',
      },
    });
    
    // CUSTOMER role'ü ata
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });
    
    if (customerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: customerRole.id,
        },
      });
    }
    
    // Hesap oluştur
    const accountNumber = `TR` + Date.now() + Math.floor(Math.random() * 1000);
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber: accountNumber,
        accountType: 'CHECKING',
        balance: 10000,
        currency: 'TRY',
      },
    });
    
    console.log('✅ Test kullanıcısı oluşturuldu!');
    console.log('Email: test@example.com');
    console.log('Şifre: test123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await prisma.`$disconnect();
  }
}

createTestUser();
"@
        
        $createUserScript | Out-File -FilePath "backend/create-test-user.js" -Encoding UTF8
        cd backend
        node create-test-user.js
        cd ..
        Remove-Item "backend/create-test-user.js" -ErrorAction SilentlyContinue
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Test kullanıcısı başarıyla oluşturuldu!" -ForegroundColor Green
            Write-Host "   Email: test@example.com" -ForegroundColor Cyan
            Write-Host "   Şifre: test123" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "❌ Database bağlantısı başarısız!" -ForegroundColor Red
    Write-Host "   Lütfen PostgreSQL'in çalıştığından emin olun" -ForegroundColor Yellow
}

