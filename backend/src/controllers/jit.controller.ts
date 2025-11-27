import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requestJITAccess, verifyJITAccess, revokeJITAccess } from '../utils/jitAccess';
import { getIpAddress, getDeviceInfo } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Request JIT access to a resource
 * Example: Employee requests access to customer data for a specific task
 */
export const requestAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { resource, resourceId, action, reason, duration } = req.body;

    if (!resource || !resourceId || !action || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['resource', 'resourceId', 'action', 'reason'],
      });
    }

    // Check if user has permission to request JIT access
    // Employees can request access to customer data
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const userRoles = user?.roles.map((ur) => ur.role.name) || [];
    if (!userRoles.includes('EMPLOYEE') && !userRoles.includes('ADMIN')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only employees can request JIT access',
      });
    }

    // Request JIT access
    const jitGrant = await requestJITAccess({
      userId: req.userId,
      resource,
      resourceId,
      action,
      reason,
      duration: duration ? parseInt(duration) : undefined,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'JIT_ACCESS_REQUESTED',
        resource,
        resourceId,
        status: 'SUCCESS',
        ipAddress: getIpAddress(req),
        userAgent: req.headers['user-agent'],
        deviceInfo: getDeviceInfo(req),
        metadata: {
          jitToken: jitGrant.token,
          reason,
          duration: duration || 30,
        },
      },
    });

    res.json({
      message: 'JIT access granted',
      access: {
        token: jitGrant.token,
        expiresAt: jitGrant.expiresAt,
        resource: jitGrant.resource,
        resourceId: jitGrant.resourceId,
        action: jitGrant.action,
      },
    });
  } catch (error) {
    console.error('Request JIT access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Use JIT access token to access resource
 */
export const useAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, resource, resourceId, action } = req.body;

    if (!token || !resource || !resourceId || !action) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['token', 'resource', 'resourceId', 'action'],
      });
    }

    const isValid = await verifyJITAccess(
      token,
      req.userId,
      resource,
      resourceId,
      action
    );

    if (!isValid) {
      return res.status(403).json({
        error: 'Invalid or expired JIT access token',
      });
    }

    res.json({
      message: 'JIT access verified',
      granted: true,
    });
  } catch (error) {
    console.error('Use JIT access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Revoke JIT access
 */
export const revokeAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await revokeJITAccess(token, req.userId);

    res.json({
      message: 'JIT access revoked successfully',
    });
  } catch (error) {
    console.error('Revoke JIT access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


