import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { getIpAddress, getDeviceInfo } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * Get account - Uses ABAC to check if user owns the account or has permission
 */
export const getAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = req.params.id;

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        transactionsFrom: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
          },
        },
        transactionsTo: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // ABAC check: User can view their own account or has account:read permission
    const abacContext = (req as any).abacContext;
    if (!abacContext) {
      // Fallback: check if user owns the account
      if (account.userId !== req.userId) {
        return res.status(403).json({ error: 'Forbidden - You can only view your own accounts' });
      }
    }

    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List user's accounts
 */
export const listAccounts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let accounts = await prisma.account.findMany({
      where: { userId: req.userId },
      include: {
        transactionsFrom: { take: 5, orderBy: { createdAt: 'desc' } },
        transactionsTo: { take: 5, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ accounts });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update account
 */
export const updateAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = req.params.id;
    const { isActive, isFrozen } = req.body;

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

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(isFrozen !== undefined && { isFrozen }),
      },
    });

    res.json({
      message: 'Account updated successfully',
      account: updatedAccount,
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Deactivate account
 */
export const deactivateAccount = async (req: AuthRequest, res: Response) => {
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

    // Check if account has balance
    if (Number(account.balance) > 0) {
      return res.status(400).json({
        error: 'Cannot deactivate account with balance',
        message: 'Please transfer or withdraw remaining balance first',
      });
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        isActive: false,
      },
    });

    res.json({
      message: 'Account deactivated successfully',
      account: updatedAccount,
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new account
 */
export const createAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { accountType, initialBalance, currency, branchCode, branchName } = req.body;

    if (!accountType) {
      return res.status(400).json({ error: 'Account type is required' });
    }

    const accountNumber = `TR${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // Generate branch info if not provided
    // If branchCode is provided, use it; otherwise generate based on branchName
    let finalBranchCode = branchCode;
    let finalBranchName: string | null = null;
    
    const branchNames = [
      'Kadıköy Şubesi', 'Beşiktaş Şubesi', 'Şişli Şubesi', 'Beyoğlu Şubesi',
      'Üsküdar Şubesi', 'Bakırköy Şubesi', 'Maltepe Şubesi', 'Kartal Şubesi',
    ];
    
    // If branchCode is provided, find existing branch with same code to get name
    if (finalBranchCode) {
      const existingAccount = await prisma.account.findFirst({
        where: { branchCode: finalBranchCode },
        select: { branchName: true },
      });
      if (existingAccount?.branchName) {
        finalBranchName = existingAccount.branchName;
      }
    }
    
    // If branchName is provided, find existing branch with same name to get code
    if (!finalBranchCode && !finalBranchName) {
      const randomBranchName = branchNames[Math.floor(Math.random() * branchNames.length)];
      const existingAccount = await prisma.account.findFirst({
        where: { branchName: randomBranchName },
        select: { branchCode: true },
      });
      
      if (existingAccount?.branchCode) {
        finalBranchCode = existingAccount.branchCode;
        finalBranchName = randomBranchName;
      } else {
        // Generate unique code
        let newCode = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        let attempts = 0;
        while (await prisma.account.findFirst({ where: { branchCode: newCode } }) && attempts < 100) {
          newCode = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
          attempts++;
        }
        finalBranchCode = newCode;
        finalBranchName = randomBranchName;
      }
    } else if (!finalBranchName) {
      // If we have a code but no name, try to find existing branch with same code
      const existingAccount = await prisma.account.findFirst({
        where: { branchCode: finalBranchCode },
        select: { branchName: true },
      });
      if (existingAccount?.branchName) {
        finalBranchName = existingAccount.branchName;
      } else {
        finalBranchName = branchNames[Math.floor(Math.random() * branchNames.length)];
      }
    } else if (!finalBranchCode) {
      // If we have a name but no code, find existing branch with same name
      const existingAccount = await prisma.account.findFirst({
        where: { branchName: finalBranchName },
        select: { branchCode: true },
      });
      if (existingAccount?.branchCode) {
        finalBranchCode = existingAccount.branchCode;
      } else {
        // Generate unique code
        let newCode = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        let attempts = 0;
        while (await prisma.account.findFirst({ where: { branchCode: newCode } }) && attempts < 100) {
          newCode = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
          attempts++;
        }
        finalBranchCode = newCode;
      }
    }

    const account = await prisma.account.create({
      data: {
        userId: req.userId,
        accountNumber,
        accountType: accountType || 'CHECKING',
        balance: initialBalance || 0,
        currency: currency || 'TRY',
        branchCode: finalBranchCode,
        branchName: finalBranchName,
        isActive: true,
        isFrozen: false,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'ACCOUNT_CREATE',
        resource: 'account',
        resourceId: account.id,
        status: 'SUCCESS',
        ipAddress: getIpAddress(req),
        userAgent: req.headers['user-agent'],
        deviceInfo: getDeviceInfo(req),
        metadata: {
          accountNumber: account.accountNumber,
          accountType: account.accountType,
        },
      },
    });

    res.status(201).json({
      message: 'Account created successfully',
      account,
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

