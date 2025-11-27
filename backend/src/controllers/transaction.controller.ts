import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '../middleware/rbac';

const prisma = new PrismaClient();

/**
 * Get transaction history
 */
export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      accountId,
      type,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get user's accounts
    const userAccounts = await prisma.account.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });

    const accountIds = userAccounts.map((acc) => acc.id);

    // Build where clause
    const where: any = {
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    };

    if (accountId) {
      where.OR = [
        { fromAccountId: accountId as string },
        { toAccountId: accountId as string },
      ];
    }

    if (type) {
      where.type = type as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount as string);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount as string);
      }
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromAccount: {
            select: {
              id: true,
              accountNumber: true,
              accountType: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              accountNumber: true,
              accountType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Format transactions
    const formattedTransactions = transactions.map((tx) => {
      const isOutgoing = tx.fromAccountId && accountIds.includes(tx.fromAccountId);
      return {
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        referenceNumber: tx.referenceNumber,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        fromAccount: tx.fromAccount
          ? {
              id: tx.fromAccount.id,
              accountNumber: tx.fromAccount.accountNumber,
              accountType: tx.fromAccount.accountType,
            }
          : null,
        toAccount: {
          id: tx.toAccount.id,
          accountNumber: tx.toAccount.accountNumber,
          accountType: tx.toAccount.accountType,
        },
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      };
    });

    res.json({
      transactions: formattedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get transaction details
 */
export const getTransactionDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transactionId = req.params.id;

    // Get user's accounts
    const userAccounts = await prisma.account.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });

    const accountIds = userAccounts.map((acc) => acc.id);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fromAccount: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        toAccount: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has access to this transaction
    const hasAccess =
      (transaction.fromAccountId && accountIds.includes(transaction.fromAccountId)) ||
      accountIds.includes(transaction.toAccountId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Cancel pending transaction
 */
export const cancelTransaction = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transactionId = req.params.id;

    // Get user's accounts
    const userAccounts = await prisma.account.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });

    const accountIds = userAccounts.map((acc) => acc.id);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check ownership
    if (!accountIds.includes(transaction.toAccountId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only pending transactions can be cancelled
    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Only pending transactions can be cancelled',
      });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'CANCELLED',
      },
    });

    // If it was a transfer, reverse the balance changes
    if (transaction.type === 'TRANSFER' && transaction.fromAccountId) {
      await prisma.account.update({
        where: { id: transaction.fromAccountId },
        data: {
          balance: {
            increment: Number(transaction.amount),
          },
        },
      });

      await prisma.account.update({
        where: { id: transaction.toAccountId },
        data: {
          balance: {
            decrement: Number(transaction.amount),
          },
        },
      });
    }

    res.json({
      message: 'Transaction cancelled successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


