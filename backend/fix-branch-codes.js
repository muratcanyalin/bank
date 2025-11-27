const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Şube adı -> şube kodu mapping
const branchNameToCode = {};

async function fixBranchCodes() {
  try {
    console.log('🔧 Şube kodları düzeltiliyor...\n');

    // Tüm hesapları getir
    const accounts = await prisma.account.findMany({
      where: {
        branchName: { not: null },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 ${accounts.length} hesap bulundu\n`);

    // Şube adına göre grupla ve kod ata
    for (const account of accounts) {
      if (!account.branchName) continue;

      // Eğer bu şube adı için kod yoksa, yeni kod oluştur
      if (!branchNameToCode[account.branchName]) {
        // Aynı şube adına sahip ilk hesabın kodunu kullan veya yeni kod oluştur
        const existingAccount = accounts.find(
          (acc) => acc.branchName === account.branchName && acc.branchCode
        );
        
        if (existingAccount && existingAccount.branchCode) {
          branchNameToCode[account.branchName] = existingAccount.branchCode;
        } else {
          // Yeni kod oluştur (001-999)
          const newCode = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
          branchNameToCode[account.branchName] = newCode;
        }
      }

      // Hesabın kodunu güncelle
      const correctCode = branchNameToCode[account.branchName];
      if (account.branchCode !== correctCode) {
        await prisma.account.update({
          where: { id: account.id },
          data: { branchCode: correctCode },
        });
        console.log(`  ✅ ${account.accountNumber}: ${account.branchCode} → ${correctCode} (${account.branchName})`);
      }
    }

    // Özet
    const uniqueBranches = new Set(
      accounts
        .filter((acc) => acc.branchName)
        .map((acc) => acc.branchName)
    );

    console.log(`\n📊 Özet:`);
    console.log(`  - Toplam hesap: ${accounts.length}`);
    console.log(`  - Farklı şube sayısı: ${uniqueBranches.size}`);
    console.log(`  - Şube kodları:`);
    for (const [name, code] of Object.entries(branchNameToCode)) {
      const count = accounts.filter((acc) => acc.branchName === name).length;
      console.log(`    ${code} - ${name} (${count} hesap)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixBranchCodes();

