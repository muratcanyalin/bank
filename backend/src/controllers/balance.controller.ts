import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { getTransferLimitUsage } from '../utils/transferLimits';

const prisma = new PrismaClient();

/**
 * Get account balance
 */
export const getAccountBalance = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = req.params.id;

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check ownership
    if (account.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        isActive: account.isActive,
      },
    });
  } catch (error) {
    console.error('Get account balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get account summary (balance + recent transactions + limits)
 */
export const getAccountSummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = req.params.id;

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check ownership
    if (account.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get transfer limit usage
    const limitUsage = await getTransferLimitUsage(req.userId);

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
        createdAt: {
          gte: today,
        },
      },
    });

    const todayIncoming = todayTransactions
      .filter((tx) => tx.toAccountId === accountId)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const todayOutgoing = todayTransactions
      .filter((tx) => tx.fromAccountId === accountId)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    res.json({
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        currency: account.currency,
        isActive: account.isActive,
        createdAt: account.createdAt,
      },
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        description: tx.description,
        referenceNumber: tx.referenceNumber,
        createdAt: tx.createdAt,
      })),
      today: {
        incoming: todayIncoming,
        outgoing: todayOutgoing,
        net: todayIncoming - todayOutgoing,
        transactionCount: todayTransactions.length,
      },
      transferLimits: limitUsage,
    });
  } catch (error) {
    console.error('Get account summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all account balances for user
 */
export const getAllBalances = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accounts = await prisma.account.findMany({
      where: {
        userId: req.userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    res.json({
      accounts: accounts.map((acc) => ({
        id: acc.id,
        accountNumber: acc.accountNumber,
        accountType: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        isActive: acc.isActive,
      })),
      totalBalance,
      accountCount: accounts.length,
    });
  } catch (error) {
    console.error('Get all balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

