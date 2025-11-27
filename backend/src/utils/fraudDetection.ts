import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FraudCheckResult {
  isFraud: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK';
}

/**
 * Basic fraud detection rules
 */
export const checkFraud = async (
  userId: string,
  amount: number,
  toAccountId: string,
  fromAccountId: string
): Promise<FraudCheckResult> => {
  const reasons: string[] = [];
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

  // Rule 1: Unusually large amount
  if (amount > 100000) {
    reasons.push('Unusually large transfer amount');
    riskLevel = 'MEDIUM';
  }

  if (amount > 500000) {
    reasons.push('Very large transfer amount');
    riskLevel = 'HIGH';
  }

  // Rule 2: Rapid successive transfers
  const recentTransfers = await prisma.transaction.findMany({
    where: {
      fromAccountId,
      type: 'TRANSFER',
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
  });

  if (recentTransfers.length >= 5) {
    reasons.push('Rapid successive transfers detected');
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
  }

  // Rule 3: Transfer to new recipient
  const previousTransfers = await prisma.transaction.findMany({
    where: {
      fromAccountId,
      toAccountId,
      type: 'TRANSFER',
    },
    take: 1,
  });

  if (previousTransfers.length === 0 && amount > 10000) {
    reasons.push('First-time transfer to new recipient with significant amount');
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
  }

  // Rule 4: Account balance check
  const fromAccount = await prisma.account.findUnique({
    where: { id: fromAccountId },
  });

  if (fromAccount) {
    const balance = Number(fromAccount.balance);
    const balanceAfterTransfer = balance - amount;

    // If transfer would leave account with very low balance
    if (balanceAfterTransfer < 100 && balance > 1000) {
      reasons.push('Transfer would leave account with very low balance');
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    }

    // If transfer is more than 90% of balance
    if (amount > balance * 0.9) {
      reasons.push('Transfer exceeds 90% of account balance');
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : 'HIGH';
    }
  }

  // Rule 5: Multiple failed transactions recently
  const recentFailed = await prisma.transaction.count({
    where: {
      fromAccountId,
      status: 'FAILED',
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentFailed >= 3) {
    reasons.push('Multiple failed transactions in the last hour');
    riskLevel = 'HIGH';
  }

  // Rule 6: Unusual time pattern (outside business hours for large amounts)
  const hour = new Date().getHours();
  if ((hour < 6 || hour > 22) && amount > 50000) {
    reasons.push('Large transfer outside business hours');
    riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
  }

  // Determine recommendation
  let recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK' = 'ALLOW';
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    recommendation = 'BLOCK';
  } else if (riskLevel === 'MEDIUM') {
    recommendation = 'REVIEW';
  }

  return {
    isFraud: riskLevel === 'CRITICAL' || (riskLevel === 'HIGH' && reasons.length >= 3),
    riskLevel,
    reasons,
    recommendation,
  };
};

/**
 * Check for suspicious account activity
 */
export const checkSuspiciousActivity = async (
  accountId: string
): Promise<{
  isSuspicious: boolean;
  indicators: string[];
}> => {
  const indicators: string[] = [];

  // Check for rapid balance changes
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  if (recentTransactions.length > 50) {
    indicators.push('Unusually high number of transactions in 24 hours');
  }

  // Check for large withdrawals
  const largeWithdrawals = recentTransactions.filter(
    (tx) => tx.fromAccountId === accountId && Number(tx.amount) > 50000
  );

  if (largeWithdrawals.length >= 3) {
    indicators.push('Multiple large withdrawals in 24 hours');
  }

  return {
    isSuspicious: indicators.length > 0,
    indicators,
  };
};


