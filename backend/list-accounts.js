const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        accountType: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log('\n📊 TÜM HESAPLAR:\n');
    accounts.forEach((acc) => {
      console.log(`Hesap: ${acc.accountNumber}`);
      console.log(`  Sahip: ${acc.user.firstName} ${acc.user.lastName} (${acc.user.email})`);
      console.log(`  Bakiye: ${Number(acc.balance).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`);
      console.log(`  Tip: ${acc.accountType}`);
      console.log(`  ID: ${acc.id}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listAccounts();

