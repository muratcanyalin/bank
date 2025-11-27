const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAccountUpdatePermission() {
  try {
    console.log('🔧 account:update permission ekleniyor...\n');

    // Get CUSTOMER role
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });

    if (!customerRole) {
      console.log('❌ CUSTOMER role bulunamadı!');
      process.exit(1);
    }

    // Get account:update permission
    const accountUpdatePermission = await prisma.permission.findUnique({
      where: { name: 'account:update' },
    });

    if (!accountUpdatePermission) {
      console.log('❌ account:update permission bulunamadı!');
      process.exit(1);
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: customerRole.id,
          permissionId: accountUpdatePermission.id,
        },
      },
    });

    if (existing) {
      console.log('✅ account:update permission zaten CUSTOMER rolüne atanmış');
    } else {
      await prisma.rolePermission.create({
        data: {
          roleId: customerRole.id,
          permissionId: accountUpdatePermission.id,
        },
      });
      console.log('✅ account:update permission CUSTOMER rolüne eklendi');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAccountUpdatePermission();

