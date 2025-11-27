const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTransfer() {
  try {
    // Get accounts
    const accounts = await prisma.account.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    if (accounts.length < 2) {
      console.log('❌ En az 2 hesap gerekli!');
      process.exit(1);
    }

    const fromAccount = accounts[0];
    const toAccount = accounts[1];

    console.log(`\n📤 Gönderen: ${fromAccount.accountNumber} (${fromAccount.user.email}) - Bakiye: ${fromAccount.balance}`);
    console.log(`📥 Alıcı: ${toAccount.accountNumber} (${toAccount.user.email}) - Bakiye: ${toAccount.balance}`);

    // Simulate transfer
    const amount = 1000;
    console.log(`\n💰 Transfer tutarı: ${amount} TRY`);

    // Check balance
    if (Number(fromAccount.balance) < amount) {
      console.log('❌ Yetersiz bakiye!');
      process.exit(1);
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: amount,
        type: 'TRANSFER',
        status: 'COMPLETED',
        description: 'Test transferi',
        referenceNumber: `TRF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      },
    });

    // Update balances
    await prisma.account.update({
      where: { id: fromAccount.id },
      data: { balance: { decrement: amount } },
    });

    await prisma.account.update({
      where: { id: toAccount.id },
      data: { balance: { increment: amount } },
    });

    // Get updated balances
    const updatedFrom = await prisma.account.findUnique({ where: { id: fromAccount.id } });
    const updatedTo = await prisma.account.findUnique({ where: { id: toAccount.id } });

    console.log(`\n✅ Transfer başarılı!`);
    console.log(`📤 Gönderen yeni bakiye: ${updatedFrom.balance} TRY`);
    console.log(`📥 Alıcı yeni bakiye: ${updatedTo.balance} TRY`);
    console.log(`📝 İşlem referansı: ${transaction.referenceNumber}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testTransfer();

