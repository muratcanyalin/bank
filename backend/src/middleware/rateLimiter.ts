import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { getIpAddress } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * In-memory rate limit store (for development)
 * In production, use Redis
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Custom rate limit store using database
 */
const createDatabaseStore = () => {
  return {
    async increment(key: string): Promise<{ totalHits: number; timeToExpire: number }> {
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const now = Date.now();
      const windowStart = new Date(now - (now % windowMs));

      // Find or create rate limit record
      const existing = await prisma.rateLimit.findUnique({
        where: {
          identifier_endpoint_windowStart: {
            identifier: key,
            endpoint: 'general',
            windowStart,
          },
        },
      });

      if (existing) {
        const updated = await prisma.rateLimit.update({
          where: {
            identifier_endpoint_windowStart: {
              identifier: key,
              endpoint: 'general',
              windowStart,
            },
          },
          data: {
            count: existing.count + 1,
            updatedAt: new Date(),
          },
        });

        return {
          totalHits: updated.count,
          timeToExpire: Math.ceil((windowStart.getTime() + windowMs - now) / 1000),
        };
      } else {
        const created = await prisma.rateLimit.create({
          data: {
            identifier: key,
            endpoint: 'general',
            count: 1,
            windowStart,
          },
        });

        return {
          totalHits: created.count,
          timeToExpire: Math.ceil(windowMs / 1000),
        };
      }
    },

    async decrement(key: string): Promise<void> {
      // Not needed for this implementation
    },

    async resetKey(key: string): Promise<void> {
      await prisma.rateLimit.deleteMany({
        where: { identifier: key },
      });
    },
  };
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createDatabaseStore(),
  keyGenerator: (req) => {
    return getIpAddress(req);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createDatabaseStore(),
  keyGenerator: (req) => {
    return `auth:${getIpAddress(req)}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again in 15 minutes.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

/**
 * Transfer rate limiter
 * 10 transfers per hour per user
 */
export const transferRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Transfer limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  store: createDatabaseStore(),
  keyGenerator: (req: any) => {
    return `transfer:${req.userId || getIpAddress(req)}`;
  },
  skip: (req: any) => !req.userId, // Skip if not authenticated
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Transfer limit exceeded',
      message: 'Maximum 10 transfers per hour allowed.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});

/**
 * Account creation rate limiter
 * 3 accounts per day per user
 */
export const accountCreationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: 'Account creation limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  store: createDatabaseStore(),
  keyGenerator: (req: any) => {
    return `account:${req.userId || getIpAddress(req)}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Account creation limit exceeded',
      message: 'Maximum 3 accounts per day allowed.',
      retryAfter: Math.ceil(24 * 60 * 60),
    });
  },
});


