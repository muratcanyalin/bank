import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '../middleware/rbac';

const prisma = new PrismaClient();

/**
 * Get audit logs with filtering
 * Requires audit:read permission
 */
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      userId,
      action,
      resource,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = {
        contains: action as string,
        mode: 'insensitive',
      };
    }

    if (resource) {
      where.resource = resource as string;
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

    // Get logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get audit log statistics
 */
export const getAuditStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate as string);
      }
    }

    // Get statistics
    const [
      totalLogs,
      successLogs,
      failedLogs,
      blockedLogs,
      loginAttempts,
      transferCount,
      customerAccessCount,
    ] = await Promise.all([
      prisma.auditLog.count({ where: dateFilter }),
      prisma.auditLog.count({
        where: { ...dateFilter, status: 'SUCCESS' },
      }),
      prisma.auditLog.count({
        where: { ...dateFilter, status: 'FAILED' },
      }),
      prisma.auditLog.count({
        where: { ...dateFilter, status: 'BLOCKED' },
      }),
      prisma.auditLog.count({
        where: { ...dateFilter, action: 'LOGIN' },
      }),
      prisma.auditLog.count({
        where: { ...dateFilter, action: 'TRANSFER' },
      }),
      prisma.auditLog.count({
        where: {
          ...dateFilter,
          action: { startsWith: 'CUSTOMER_' },
        },
      }),
    ]);

    // Get top actions
    const topActions = await prisma.auditLog.groupBy({
      by: ['action'],
      where: dateFilter,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    // Get failed login attempts by IP
    const failedLoginByIP = await prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        ...dateFilter,
        action: 'LOGIN',
        status: 'FAILED',
      },
      _count: {
        ipAddress: true,
      },
      orderBy: {
        _count: {
          ipAddress: 'desc',
        },
      },
      take: 10,
    });

    res.json({
      summary: {
        total: totalLogs,
        success: successLogs,
        failed: failedLogs,
        blocked: blockedLogs,
      },
      actions: {
        loginAttempts,
        transfers: transferCount,
        customerAccess: customerAccessCount,
      },
      topActions: topActions.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      security: {
        failedLoginByIP: failedLoginByIP.map((item) => ({
          ipAddress: item.ipAddress,
          count: item._count.ipAddress,
        })),
      },
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's own audit logs
 */
export const getMyAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, startDate, endDate, limit = '20' } = req.query;

    const where: any = {
      userId: req.userId,
    };

    if (action) {
      where.action = action as string;
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

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get my audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get customer access logs (for employees)
 */
export const getCustomerAccessLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { customerId, employeeId, startDate, endDate, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      action: { startsWith: 'CUSTOMER_' },
    };

    if (customerId) {
      where.resourceId = customerId as string;
    }

    if (employeeId) {
      where.userId = employeeId as string;
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

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get customer access logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get transfer logs with fraud detection indicators
 */
export const getTransferLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, startDate, endDate, minAmount, status, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      action: 'TRANSFER',
    };

    if (userId) {
      where.userId = userId as string;
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

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    // Add fraud detection indicators
    const logsWithFraudIndicators = logs.map((log) => {
      const metadata = log.metadata as any;
      const amount = metadata?.amount || 0;
      const riskScore = metadata?.riskScore || 0;

      const fraudIndicators: string[] = [];

      if (amount > 100000) {
        fraudIndicators.push('High-value transfer');
      }

      if (riskScore > 70) {
        fraudIndicators.push('High risk score');
      }

      if (log.status === 'BLOCKED') {
        fraudIndicators.push('Blocked by security');
      }

      if (log.ipAddress && log.ipAddress.includes('192.168.')) {
        fraudIndicators.push('Private IP (possible VPN)');
      }

      return {
        ...log,
        fraudIndicators,
      };
    });

    const total = await prisma.auditLog.count({ where });

    res.json({
      logs: logsWithFraudIndicators,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get transfer logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


