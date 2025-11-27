import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

async function seedMockData() {
  try {
    console.log('🌱 Mock data seed başlatılıyor...\n');

    // 1. Mock kullanıcılar oluştur
    console.log('📝 Mock kullanıcılar oluşturuluyor...');
    
    const mockUsers = [
      {
        email: 'ahmet@example.com',
        password: 'test123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        phoneNumber: '+90 555 123 4567',
      },
      {
        email: 'ayse@example.com',
        password: 'test123',
        firstName: 'Ayşe',
        lastName: 'Demir',
        phoneNumber: '+90 555 234 5678',
      },
      {
        email: 'mehmet@example.com',
        password: 'test123',
        firstName: 'Mehmet',
        lastName: 'Kaya',
        phoneNumber: '+90 555 345 6789',
      },
    ];

    const createdUsers = [];
    for (const userData of mockUsers) {
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        const passwordHash = await hashPassword(userData.password);
        user = await prisma.user.create({
          data: {
            email: userData.email,
            passwordHash,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            emailVerified: true,
            isActive: true,
          },
        });

        // Assign CUSTOMER role
        let customerRole = await prisma.role.findUnique({
          where: { name: 'CUSTOMER' },
        });
        if (!customerRole) {
          customerRole = await prisma.role.create({
            data: { name: 'CUSTOMER', description: 'Customer role' },
          });
        }
        await prisma.userRole.create({
          data: { userId: user.id, roleId: customerRole.id },
        });

        console.log(`  ✅ ${userData.firstName} ${userData.lastName} oluşturuldu`);
      } else {
        console.log(`  ⚠️  ${userData.firstName} ${userData.lastName} zaten mevcut`);
      }

      createdUsers.push(user);
    }

    // 2. Mock hesaplar oluştur
    console.log('\n💳 Mock hesaplar oluşturuluyor...');
    
    const mockAccounts = [
      { userId: createdUsers[0].id, accountType: 'CHECKING', balance: 85000.00 },
      { userId: createdUsers[0].id, accountType: 'SAVINGS', balance: 40000.50 },
      { userId: createdUsers[1].id, accountType: 'CHECKING', balance: 50000.00 },
      { userId: createdUsers[2].id, accountType: 'CHECKING', balance: 150000.00 },
      { userId: createdUsers[2].id, accountType: 'SAVINGS', balance: 75000.00 },
      { userId: createdUsers[2].id, accountType: 'CHECKING', balance: 25000.75 },
    ];

    const createdAccounts = [];
    for (const accountData of mockAccounts) {
      const accountNumber = `TR${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const account = await prisma.account.create({
        data: {
          userId: accountData.userId,
          accountNumber,
          accountType: accountData.accountType,
          balance: accountData.balance,
          currency: 'TRY',
          isActive: true,
        },
      });
      createdAccounts.push(account);
      console.log(`  ✅ ${account.accountType} hesabı oluşturuldu: ${account.accountNumber}`);
    }

    // 3. Mock işlemler oluştur
    console.log('\n💰 Mock işlemler oluşturuluyor...');
    
    // Create a system account for payments/withdrawals that don't have a destination
    const systemAccount = await prisma.account.create({
      data: {
        userId: createdUsers[0].id, // Use first user as owner
        accountNumber: 'SYSTEM-0000000000000000',
        accountType: 'CHECKING',
        balance: 0,
        currency: 'TRY',
        isActive: true,
      },
    });

    const mockTransactions = [
      {
        fromAccountId: null,
        toAccountId: createdAccounts[0].id,
        amount: 15000.00,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Maaş',
        createdAt: new Date('2024-01-14T09:15:00Z'),
      },
      {
        fromAccountId: createdAccounts[0].id,
        toAccountId: createdAccounts[1].id,
        amount: 500.00,
        type: 'TRANSFER',
        status: 'COMPLETED',
        description: 'Havale',
        createdAt: new Date('2024-01-13T16:45:00Z'),
      },
      {
        fromAccountId: createdAccounts[0].id,
        toAccountId: systemAccount.id, // Use system account for payments
        amount: 250.00,
        type: 'PAYMENT',
        status: 'COMPLETED',
        description: 'Mağaza Ödemesi',
        createdAt: new Date('2024-01-15T14:30:00Z'),
      },
      {
        fromAccountId: createdAccounts[0].id,
        toAccountId: createdAccounts[2].id,
        amount: 1000.00,
        type: 'TRANSFER',
        status: 'PENDING',
        description: 'Para Transferi',
        createdAt: new Date('2024-01-12T11:20:00Z'),
      },
      {
        fromAccountId: createdAccounts[0].id,
        toAccountId: systemAccount.id, // Use system account for withdrawals
        amount: 200.00,
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        description: 'ATM Para Çekme',
        createdAt: new Date('2024-01-11T13:10:00Z'),
      },
    ];

    for (const txData of mockTransactions) {
      const referenceNumber = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await prisma.transaction.create({
        data: {
          ...txData,
          referenceNumber,
          currency: 'TRY',
        },
      });
      console.log(`  ✅ ${txData.type} işlemi oluşturuldu: ${referenceNumber}`);
    }

    // 4. Mock audit loglar oluştur (employee panel için)
    console.log('\n📋 Mock audit loglar oluşturuluyor...');
    
    // Employee user oluştur
    let employeeUser = await prisma.user.findUnique({
      where: { email: 'employee@example.com' },
    });

    if (!employeeUser) {
      const passwordHash = await hashPassword('test123');
      employeeUser = await prisma.user.create({
        data: {
          email: 'employee@example.com',
          passwordHash,
          firstName: 'Demo',
          lastName: 'Çalışan',
          emailVerified: true,
          isActive: true,
        },
      });

      let employeeRole = await prisma.role.findUnique({
        where: { name: 'EMPLOYEE' },
      });
      if (!employeeRole) {
        employeeRole = await prisma.role.create({
          data: { name: 'EMPLOYEE', description: 'Employee role' },
        });
      }
      await prisma.userRole.create({
        data: { userId: employeeUser.id, roleId: employeeRole.id },
      });
    }

    const mockAuditLogs = [
      {
        userId: employeeUser.id,
        action: 'VIEW_CUSTOMER',
        resource: `/api/customers/${createdUsers[0].id}`,
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        deviceInfo: 'Desktop|Windows|Chrome',
        metadata: {
          customerId: createdUsers[0].id,
          customerName: 'Ahmet Yılmaz',
        },
        createdAt: new Date('2024-01-15T14:30:00Z'),
      },
      {
        userId: employeeUser.id,
        action: 'VIEW_CUSTOMER',
        resource: `/api/customers/${createdUsers[1].id}`,
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        deviceInfo: 'Desktop|Windows|Chrome',
        metadata: {
          customerId: createdUsers[1].id,
          customerName: 'Ayşe Demir',
        },
        createdAt: new Date('2024-01-14T10:15:00Z'),
      },
      {
        userId: employeeUser.id,
        action: 'TRANSFER_APPROVAL',
        resource: `/api/transfers/approve`,
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        deviceInfo: 'Desktop|Windows|Chrome',
        metadata: {
          customerId: createdUsers[2].id,
          customerName: 'Mehmet Kaya',
        },
        createdAt: new Date('2024-01-13T16:45:00Z'),
      },
    ];

    for (const logData of mockAuditLogs) {
      await prisma.auditLog.create({
        data: logData,
      });
      console.log(`  ✅ ${logData.action} logu oluşturuldu`);
    }

    console.log('\n✅ Mock data seed tamamlandı!');
    console.log('\n📊 Özet:');
    console.log(`  - ${createdUsers.length} kullanıcı`);
    console.log(`  - ${createdAccounts.length} hesap`);
    console.log(`  - ${mockTransactions.length} işlem`);
    console.log(`  - ${mockAuditLogs.length} audit log`);

  } catch (error) {
    console.error('❌ Seed hatası:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedMockData()
  .then(() => {
    console.log('\n🎉 Seed işlemi başarıyla tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed işlemi başarısız:', error);
    process.exit(1);
  });

