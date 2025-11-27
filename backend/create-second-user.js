const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSecondUser() {
  try {
    // Kullanıcı var mı kontrol et
    const existing = await prisma.user.findUnique({
      where: { email: 'user2@example.com' },
    });

    if (existing) {
      console.log('✅ İkinci kullanıcı zaten mevcut!');
      console.log('Email: user2@example.com');
      console.log('Şifre: test123');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        passwordHash: passwordHash,
        firstName: 'İkinci',
        lastName: 'Kullanıcı',
        phoneNumber: '+905559876543',
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
        balance: 5000,
        currency: 'TRY',
      },
    });
    
    console.log('✅ İkinci kullanıcı oluşturuldu!');
    console.log('Email: user2@example.com');
    console.log('Şifre: test123');
    console.log('Hesap bakiyesi: ₺5.000,00');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSecondUser();

