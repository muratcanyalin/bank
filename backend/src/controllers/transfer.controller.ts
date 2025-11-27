import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { getIpAddress, getDeviceInfo } from '../utils/jwt';
import { AuditLogService } from '../services/auditLog.service';
import { checkTransferLimits } from '../utils/transferLimits';
import { checkFraud } from '../utils/fraudDetection';

const prisma = new PrismaClient();

/**
 * Create money transfer
 * Protected by Zero-Trust middleware
 */
export const createTransfer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fromAccountId, toAccountId, toAccountIdentifier, amount, description } = req.body;

    // Support both toAccountId and toAccountIdentifier for backward compatibility
    const destinationAccount = toAccountIdentifier || toAccountId;

    if (!fromAccountId || !destinationAccount || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['fromAccountId', 'toAccountIdentifier (or toAccountId)', 'amount'],
      });
    }

    const transferAmount = parseFloat(amount);

    if (transferAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Check transfer limits (mock mode kaldırıldı)
    const limitCheck = await checkTransferLimits(req.userId, transferAmount);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        error: 'Transfer limit exceeded',
        message: limitCheck.reason,
        limits: limitCheck.limits,
      });
    }

    // Fraud detection - temporarily more lenient for development
    const fraudCheck = await checkFraud(
      req.userId,
      transferAmount,
      destinationAccount,
      fromAccountId
    );

    // Only block if fraud check explicitly recommends BLOCK (very strict)
    // For development, we'll allow REVIEW recommendations
    if (fraudCheck.recommendation === 'BLOCK' && fraudCheck.riskLevel === 'CRITICAL') {
      await AuditLogService.logTransfer(
        req.userId,
        'fraud-blocked',
        transferAmount,
        fromAccountId,
        destinationAccount,
        'BLOCKED',
        getIpAddress(req),
        req.headers['user-agent'] || '',
        getDeviceInfo(req),
        {
          fraudReasons: fraudCheck.reasons,
          riskLevel: fraudCheck.riskLevel,
        }
      );

      return res.status(403).json({
        error: 'Transfer blocked due to fraud detection',
        reasons: fraudCheck.reasons,
        riskLevel: fraudCheck.riskLevel,
      });
    }

    if (fraudCheck.recommendation === 'REVIEW') {
      // For review, we'll still allow but flag it
      // In production, this would trigger manual review
      console.log('⚠️ Transfer flagged for review:', fraudCheck.reasons);
    }

    // Mock account ve transaction bloklarını kaldır
    let fromAccount = await prisma.account.findUnique({ where: { id: fromAccountId } });
    if (!fromAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }
    if (fromAccount.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only transfer from your own accounts' });
    }
    if (!fromAccount.isActive) {
      return res.status(400).json({ error: 'Account is not active' });
    }
    if (fromAccount.isFrozen) {
      return res.status(400).json({ error: 'Account is frozen. You cannot transfer from a frozen account' });
    }
    if (Number(fromAccount.balance) < transferAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    // destinationAccount can be either account ID or account number
    let toAccount = await prisma.account.findUnique({ where: { id: destinationAccount } });
    if (!toAccount) {
      // Try to find by account number
      toAccount = await prisma.account.findUnique({ where: { accountNumber: destinationAccount } });
    }
    if (!toAccount) {
      return res.status(404).json({ error: 'Destination account not found. Please check the account number or ID.' });
    }

    // Check risk score from zero-trust middleware
    const riskScore = (req as any).riskScore;
    if (riskScore && riskScore.recommendation === 'REVIEW' && transferAmount > 50000) {
      // High-value transfer with high risk - require additional approval
      return res.status(403).json({
        error: 'Additional approval required',
        message: 'This transfer requires additional approval due to risk assessment',
        riskScore: riskScore.score,
      });
    }

    // Generate reference number
    const referenceNumber = `TRF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    let transaction;
    // Mock transaction kaldırıldı
    transaction = await prisma.transaction.create({
      data: {
        fromAccountId,
        toAccountId: toAccount.id, // Use found toAccount's ID
        amount: transferAmount,
        type: 'TRANSFER',
        status: 'COMPLETED',
        description: description || 'Money transfer',
        referenceNumber,
      },
    });

    // Update account balances
    await prisma.account.update({
      where: { id: fromAccountId },
      data: {
        balance: {
          decrement: transferAmount,
        },
      },
    });

    await prisma.account.update({
      where: { id: toAccount.id }, // Use found toAccount's ID
      data: {
        balance: {
          increment: transferAmount,
        },
      },
    });

    // transaction ve auditlog kodları gerçek kalsın
    await AuditLogService.logTransfer(
      req.userId,
      transaction.id,
      transferAmount,
      fromAccountId,
      toAccount.id, // Use found toAccount's ID
      'SUCCESS',
      getIpAddress(req),
      req.headers['user-agent'] || '',
      getDeviceInfo(req),
      {
        referenceNumber,
        riskScore: riskScore?.score,
      }
    );

    res.status(201).json({
      message: 'Transfer completed successfully',
      transaction: {
        id: transaction.id,
        referenceNumber: transaction.referenceNumber,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

