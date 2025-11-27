const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Kullanıcı var mı kontrol et
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (existing) {
      console.log('✅ Test kullanıcısı zaten mevcut!');
      console.log('Email: test@example.com');
      console.log('Şifre: test123');
      process.exit(0);
    }

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
    
    // CUSTOMER role'ü bul veya oluştur
    let customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });
    
    if (!customerRole) {
      customerRole = await prisma.role.create({
        data: {
          name: 'CUSTOMER',
          description: 'Customer role',
        },
      });
    }
    
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: customerRole.id,
      },
    });
    
    // Hesap oluştur
    const accountNumber = `TR${Date.now()}${Math.floor(Math.random() * 1000)}`;
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
    await prisma.$disconnect();
  }
}

createTestUser();

