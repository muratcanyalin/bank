const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBranchCodesUnique() {
  try {
    console.log('🔧 Şube kodları düzeltiliyor (unique)...\n');

    // Tüm hesapları getir
    const accounts = await prisma.account.findMany({
      where: {
        branchName: { not: null },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 ${accounts.length} hesap bulundu\n`);

    // Şube adına göre grupla
    const branchGroups = {};
    for (const account of accounts) {
      if (!account.branchName) continue;
      
      if (!branchGroups[account.branchName]) {
        branchGroups[account.branchName] = [];
      }
      branchGroups[account.branchName].push(account);
    }

    // Her şube adı için unique kod ata
    const branchNameToCode = {};
    let codeCounter = 1;

    for (const [branchName, branchAccounts] of Object.entries(branchGroups)) {
      // İlk hesabın kodunu kullan veya yeni kod oluştur
      const firstAccount = branchAccounts[0];
      let assignedCode = firstAccount.branchCode;

      // Eğer bu kod başka bir şube adına aitse, yeni kod oluştur
      if (assignedCode) {
        const conflictingAccount = await prisma.account.findFirst({
          where: {
            branchCode: assignedCode,
            branchName: { not: branchName },
          },
        });

        if (conflictingAccount) {
          // Çakışma var, yeni kod oluştur
          assignedCode = String(codeCounter++).padStart(3, '0');
          // Kodun unique olduğundan emin ol
          while (await prisma.account.findFirst({ where: { branchCode: assignedCode, branchName: { not: branchName } } })) {
            assignedCode = String(codeCounter++).padStart(3, '0');
          }
        }
      } else {
        // Kod yoksa yeni kod oluştur
        assignedCode = String(codeCounter++).padStart(3, '0');
        while (await prisma.account.findFirst({ where: { branchCode: assignedCode } })) {
          assignedCode = String(codeCounter++).padStart(3, '0');
        }
      }

      branchNameToCode[branchName] = assignedCode;

      // Tüm hesapları güncelle
      for (const account of branchAccounts) {
        if (account.branchCode !== assignedCode) {
          await prisma.account.update({
            where: { id: account.id },
            data: { branchCode: assignedCode },
          });
          console.log(`  ✅ ${account.accountNumber}: ${account.branchCode || 'null'} → ${assignedCode} (${branchName})`);
        }
      }
    }

    // Özet
    console.log(`\n📊 Özet:`);
    console.log(`  - Toplam hesap: ${accounts.length}`);
    console.log(`  - Farklı şube sayısı: ${Object.keys(branchNameToCode).length}`);
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

fixBranchCodesUnique();

