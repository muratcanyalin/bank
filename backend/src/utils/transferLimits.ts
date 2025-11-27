import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TransferLimit {
  dailyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;
  maxTransactionsPerDay: number;
}

/**
 * Default transfer limits
 */
export const DEFAULT_LIMITS: TransferLimit = {
  dailyLimit: 50000, // 50,000 TRY per day
  monthlyLimit: 500000, // 500,000 TRY per month
  singleTransactionLimit: 100000, // 100,000 TRY per transaction
  maxTransactionsPerDay: 20, // Max 20 transactions per day
};

/**
 * Check transfer limits
 */
export const checkTransferLimits = async (
  userId: string,
  amount: number
): Promise<{ allowed: boolean; reason?: string; limits?: TransferLimit }> => {
  const limits = DEFAULT_LIMITS;

  // Check single transaction limit
  if (amount > limits.singleTransactionLimit) {
    return {
      allowed: false,
      reason: `Single transaction limit exceeded. Maximum: ${limits.singleTransactionLimit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
      limits,
    };
  }

  // Get user's accounts
  const userAccounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });

  const accountIds = userAccounts.map((acc) => acc.id);

  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = await prisma.transaction.findMany({
    where: {
      fromAccountId: { in: accountIds },
      type: 'TRANSFER',
      status: { in: ['COMPLETED', 'PENDING'] },
      createdAt: {
        gte: today,
      },
    },
  });

  const todayTotal = todayTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  if (todayTotal + amount > limits.dailyLimit) {
    return {
      allowed: false,
      reason: `Daily limit exceeded. Used: ${todayTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}, Limit: ${limits.dailyLimit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
      limits,
    };
  }

  // Check monthly limit
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthTransactions = await prisma.transaction.findMany({
    where: {
      fromAccountId: { in: accountIds },
      type: 'TRANSFER',
      status: { in: ['COMPLETED', 'PENDING'] },
      createdAt: {
        gte: monthStart,
      },
    },
  });

  const monthTotal = monthTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  if (monthTotal + amount > limits.monthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly limit exceeded. Used: ${monthTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}, Limit: ${limits.monthlyLimit.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
      limits,
    };
  }

  // Check max transactions per day
  if (todayTransactions.length >= limits.maxTransactionsPerDay) {
    return {
      allowed: false,
      reason: `Maximum transactions per day exceeded. Limit: ${limits.maxTransactionsPerDay}`,
      limits,
    };
  }

  return {
    allowed: true,
    limits,
  };
};

/**
 * Get user's transfer limit usage
 */
export const getTransferLimitUsage = async (
  userId: string
): Promise<{
  daily: { used: number; limit: number; remaining: number };
  monthly: { used: number; limit: number; remaining: number };
  singleTransaction: { limit: number };
  transactionsToday: number;
  maxTransactionsPerDay: number;
}> => {
  const limits = DEFAULT_LIMITS;

  // Get user's accounts
  const userAccounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });

  const accountIds = userAccounts.map((acc) => acc.id);

  // Today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = await prisma.transaction.findMany({
    where: {
      fromAccountId: { in: accountIds },
      type: 'TRANSFER',
      status: { in: ['COMPLETED', 'PENDING'] },
      createdAt: {
        gte: today,
      },
    },
  });

  const todayTotal = todayTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  // Monthly transactions
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthTransactions = await prisma.transaction.findMany({
    where: {
      fromAccountId: { in: accountIds },
      type: 'TRANSFER',
      status: { in: ['COMPLETED', 'PENDING'] },
      createdAt: {
        gte: monthStart,
      },
    },
  });

  const monthTotal = monthTransactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  );

  return {
    daily: {
      used: todayTotal,
      limit: limits.dailyLimit,
      remaining: limits.dailyLimit - todayTotal,
    },
    monthly: {
      used: monthTotal,
      limit: limits.monthlyLimit,
      remaining: limits.monthlyLimit - monthTotal,
    },
    singleTransaction: {
      limit: limits.singleTransactionLimit,
    },
    transactionsToday: todayTransactions.length,
    maxTransactionsPerDay: limits.maxTransactionsPerDay,
  };
};


