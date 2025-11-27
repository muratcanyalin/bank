const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log('\n📊 TÜM HESAPLAR:\n');
    accounts.forEach((acc, index) => {
      console.log(`${index + 1}. Hesap: ${acc.accountNumber}`);
      console.log(`   Sahip: ${acc.user.firstName} ${acc.user.lastName} (${acc.user.email})`);
      console.log(`   Bakiye: ${Number(acc.balance).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`);
      console.log(`   ID: ${acc.id}`);
      console.log('');
    });

    if (accounts.length >= 2) {
      console.log('\n💡 TRANSFER TESTİ İÇİN:');
      console.log(`   Gönderen: ${accounts[0].accountNumber} (${accounts[0].user.email})`);
      console.log(`   Alıcı: ${accounts[1].accountNumber} (${accounts[1].user.email})`);
      console.log(`\n   Transfer komutu:`);
      console.log(`   - Gönderen hesap ID: ${accounts[0].id}`);
      console.log(`   - Alıcı hesap numarası: ${accounts[1].accountNumber}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getAllAccounts();

