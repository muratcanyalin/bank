const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const branchNames = [
  'Kadıköy Şubesi',
  'Beşiktaş Şubesi',
  'Şişli Şubesi',
  'Beyoğlu Şubesi',
  'Üsküdar Şubesi',
  'Bakırköy Şubesi',
  'Maltepe Şubesi',
  'Kartal Şubesi',
  'Pendik Şubesi',
  'Ataşehir Şubesi',
  'Mecidiyeköy Şubesi',
  'Levent Şubesi',
  'Etiler Şubesi',
  'Nişantaşı Şubesi',
  'Taksim Şubesi',
  'Maslak Şubesi',
  'Sarıyer Şubesi',
  'Beylikdüzü Şubesi',
  'Avcılar Şubesi',
  'Bahçelievler Şubesi',
];

function getRandomBranchCode() {
  return String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
}

function getRandomBranchName() {
  return branchNames[Math.floor(Math.random() * branchNames.length)];
}

async function updateBranchInfo() {
  try {
    console.log('🌱 Şube bilgileri güncelleniyor...\n');

    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { branchCode: null },
          { branchName: null },
        ],
      },
    });

    console.log(`📊 ${accounts.length} hesap bulundu\n`);

    let updated = 0;
    for (const account of accounts) {
      const branchCode = account.branchCode || getRandomBranchCode();
      const branchName = account.branchName || getRandomBranchName();

      await prisma.account.update({
        where: { id: account.id },
        data: {
          branchCode,
          branchName,
        },
      });

      updated++;
      console.log(`  ✅ ${account.accountNumber}: Şube ${branchCode} - ${branchName}`);
    }

    console.log(`\n✅ ${updated} hesap güncellendi!`);

    const allAccounts = await prisma.account.findMany({
      select: {
        branchCode: true,
        branchName: true,
      },
    });

    const uniqueBranches = new Set(
      allAccounts
        .filter((acc) => acc.branchCode && acc.branchName)
        .map((acc) => `${acc.branchCode}-${acc.branchName}`)
    );

    console.log(`\n📊 Özet:`);
    console.log(`  - Toplam hesap: ${allAccounts.length}`);
    console.log(`  - Şube bilgisi olan: ${allAccounts.filter((acc) => acc.branchCode).length}`);
    console.log(`  - Farklı şube sayısı: ${uniqueBranches.size}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateBranchInfo();

