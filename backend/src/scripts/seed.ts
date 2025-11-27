import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Roles
  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Regular customer role',
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Bank employee role',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role',
    },
  });

  console.log('✅ Roles created');

  // Create Permissions
  const permissions = [
    // Account permissions
    { name: 'account:read', resource: 'account', action: 'read', description: 'View own accounts' },
    { name: 'account:create', resource: 'account', action: 'create', description: 'Create new account' },
    { name: 'account:update', resource: 'account', action: 'update', description: 'Update own account' },
    { name: 'account:delete', resource: 'account', action: 'delete', description: 'Delete own account' },
    
    // Transfer permissions
    { name: 'transfer:create', resource: 'transfer', action: 'create', description: 'Create money transfer' },
    { name: 'transfer:read', resource: 'transfer', action: 'read', description: 'View transfers' },
    { name: 'transfer:approve', resource: 'transfer', action: 'approve', description: 'Approve transfers' },
    
    // Customer permissions (for employees)
    { name: 'customer:view', resource: 'customer', action: 'read', description: 'View customer data' },
    { name: 'customer:modify', resource: 'customer', action: 'update', description: 'Modify customer data' },
    { name: 'customer:list', resource: 'customer', action: 'list', description: 'List all customers' },
    
    // Transaction permissions
    { name: 'transaction:read', resource: 'transaction', action: 'read', description: 'View transactions' },
    { name: 'transaction:create', resource: 'transaction', action: 'create', description: 'Create transaction' },
    
    // Admin permissions
    { name: 'admin:all', resource: 'admin', action: 'all', description: 'Full admin access' },
    { name: 'role:manage', resource: 'role', action: 'manage', description: 'Manage roles and permissions' },
    { name: 'audit:read', resource: 'audit', action: 'read', description: 'View audit logs' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log('✅ Permissions created');

  // Assign permissions to CUSTOMER role
  const customerPermissions = [
    'account:read',
    'account:create',
    'account:update', // Added for account freeze/unfreeze and update
    'transfer:create',
    'transfer:read',
    'transaction:read',
  ];

  for (const permName of customerPermissions) {
    const permission = createdPermissions.find((p) => p.name === permName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: customerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: customerRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✅ Customer permissions assigned');

  // Assign permissions to EMPLOYEE role
  const employeePermissions = [
    'account:read',
    'account:create',
    'account:update',
    'transfer:create',
    'transfer:read',
    'transfer:approve',
    'customer:view',
    'customer:list',
    'transaction:read',
    'transaction:create',
    'audit:read',
  ];

  for (const permName of employeePermissions) {
    const permission = createdPermissions.find((p) => p.name === permName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: employeeRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✅ Employee permissions assigned');

  // Assign permissions to ADMIN role (all permissions)
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Admin permissions assigned');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


