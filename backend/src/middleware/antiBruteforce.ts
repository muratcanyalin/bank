import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIpAddress } from '../utils/jwt';

const prisma = new PrismaClient();

interface BruteforceAttempt {
  ipAddress: string;
  identifier: string; // email or userId
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

/**
 * Anti-bruteforce protection
 * Blocks IP/identifier after multiple failed attempts
 */
export const antiBruteforce = (
  maxAttempts: number = 5,
  blockDurationMinutes: number = 15,
  windowMinutes: number = 15
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ipAddress = getIpAddress(req);
    const identifier = req.body.email || req.body.userId || ipAddress;

    try {
      // Check recent failed attempts
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

      const failedAttempts = await prisma.auditLog.count({
        where: {
          OR: [
            { ipAddress },
            { userId: identifier },
          ],
          action: 'LOGIN',
          status: 'FAILED',
          createdAt: {
            gte: windowStart,
          },
        },
      });

      // Check if already blocked
      const recentBlock = await prisma.auditLog.findFirst({
        where: {
          OR: [
            { ipAddress },
            { userId: identifier },
          ],
          action: 'BRUTEFORCE_BLOCK',
          status: 'BLOCKED',
          createdAt: {
            gte: windowStart,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (recentBlock) {
        const blockTime = new Date(recentBlock.createdAt);
        const blockUntil = new Date(blockTime.getTime() + blockDurationMinutes * 60 * 1000);

        if (new Date() < blockUntil) {
          const remainingMinutes = Math.ceil((blockUntil.getTime() - Date.now()) / (60 * 1000));

          await prisma.auditLog.create({
            data: {
              action: 'BRUTEFORCE_BLOCK',
              resource: 'authentication',
              status: 'BLOCKED',
              ipAddress,
              userAgent: req.headers['user-agent'],
              metadata: {
                reason: 'Already blocked',
                remainingMinutes,
              },
            },
          });

          return res.status(429).json({
            error: 'Account temporarily locked',
            message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
            retryAfter: remainingMinutes * 60,
          });
        }
      }

      // Check if exceeded max attempts
      if (failedAttempts >= maxAttempts) {
        const blockUntil = new Date();
        blockUntil.setMinutes(blockUntil.getMinutes() + blockDurationMinutes);

        await prisma.auditLog.create({
          data: {
            action: 'BRUTEFORCE_BLOCK',
            resource: 'authentication',
            status: 'BLOCKED',
            ipAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              identifier,
              failedAttempts,
              blockUntil: blockUntil.toISOString(),
              reason: 'Max attempts exceeded',
            },
          },
        });

        return res.status(429).json({
          error: 'Account temporarily locked',
          message: `Too many failed login attempts. Please try again in ${blockDurationMinutes} minutes.`,
          retryAfter: blockDurationMinutes * 60,
        });
      }

      // Store failed attempt count in request for logging
      (req as any).bruteforceAttempts = failedAttempts;
      next();
    } catch (error) {
      console.error('Anti-bruteforce error:', error);
      // Don't block on error - allow request through
      next();
    }
  };
};

/**
 * Progressive delay based on failed attempts
 * Adds increasing delay to slow down brute force attacks
 */
export const progressiveDelay = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ipAddress = getIpAddress(req);
    const identifier = req.body.email || req.body.userId || ipAddress;

    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - 15);

      const failedAttempts = await prisma.auditLog.count({
        where: {
          OR: [
            { ipAddress },
            { userId: identifier },
          ],
          action: 'LOGIN',
          status: 'FAILED',
          createdAt: {
            gte: windowStart,
          },
        },
      });

      // Progressive delay: 0s, 1s, 2s, 4s, 8s, 16s
      if (failedAttempts > 0) {
        const delayMs = Math.min(Math.pow(2, failedAttempts - 1) * 1000, 16000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      next();
    } catch (error) {
      console.error('Progressive delay error:', error);
      next();
    }
  };
};


