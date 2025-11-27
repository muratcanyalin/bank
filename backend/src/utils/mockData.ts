/**
 * Mock Data for testing without database
 */

export const mockUsers = [
  {
    id: 'mock-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: 'hashed',
    isActive: true,
    emailVerified: true,
  },
];

export const mockAccounts = [
  {
    id: 'mock-account-1',
    userId: 'mock-user-1',
    accountNumber: 'TR123456789012345678901234',
    accountType: 'CHECKING',
    balance: 85000.00,
    currency: 'TRY',
    isActive: true,
  },
  {
    id: 'mock-account-2',
    userId: 'mock-user-1',
    accountNumber: 'TR987654321098765432109876',
    accountType: 'SAVINGS',
    balance: 40000.50,
    currency: 'TRY',
    isActive: true,
  },
];

export const mockTransactions = [
  {
    id: 'mock-tx-1',
    fromAccountId: null,
    toAccountId: 'mock-account-1',
    amount: 15000.00,
    type: 'DEPOSIT',
    status: 'COMPLETED',
    description: 'Maaş',
    referenceNumber: 'REF-2024-001',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: 'mock-tx-2',
    fromAccountId: 'mock-account-1',
    toAccountId: 'mock-account-2',
    amount: 500.00,
    type: 'TRANSFER',
    status: 'COMPLETED',
    description: 'Havale',
    referenceNumber: 'REF-2024-002',
    createdAt: new Date('2024-01-13'),
  },
];


