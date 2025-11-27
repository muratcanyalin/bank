import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ABAC (Attribute-Based Access Control) Context
 * Evaluates access based on user attributes, resource attributes, and environment
 */
export interface ABACContext {
  user: {
    id: string;
    roles: string[];
    permissions: string[];
    attributes?: Record<string, any>;
  };
  resource: {
    type: string;
    id?: string;
    ownerId?: string;
    attributes?: Record<string, any>;
  };
  action: string;
  environment?: {
    ipAddress?: string;
    timeOfDay?: number;
    deviceInfo?: string;
  };
}

/**
 * ABAC Policy Checker
 * Checks if access should be granted based on context
 */
export const checkABACPolicy = async (context: ABACContext): Promise<boolean> => {
  const { user, resource, action } = context;

  // Policy 1: Users can only access their own resources (unless they have admin/employee role)
  if (resource.ownerId && resource.ownerId !== user.id) {
    const hasAdminAccess = user.roles.includes('ADMIN') || user.roles.includes('EMPLOYEE');
    if (!hasAdminAccess) {
      return false;
    }
  }

  // Policy 2: Employees can view customer data but need explicit permission
  if (user.roles.includes('EMPLOYEE') && resource.type === 'customer') {
    if (!user.permissions.includes('customer:view')) {
      return false;
    }
    // Additional check: Employee can only view, not modify customer data without special permission
    if (action !== 'read' && !user.permissions.includes('customer:modify')) {
      return false;
    }
  }

  // Policy 3: Time-based access (example: certain operations only during business hours)
  if (context.environment?.timeOfDay) {
    const hour = new Date().getHours();
    // Example: High-value transfers only during business hours (9-17)
    if (action === 'transfer:create' && resource.attributes?.amount > 100000) {
      if (hour < 9 || hour > 17) {
        return false; // Block high-value transfers outside business hours
      }
    }
  }

  // Policy 4: IP-based restrictions (example: admin operations only from trusted IPs)
  // This would be configured in environment variables
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  if (user.roles.includes('ADMIN') && context.environment?.ipAddress) {
    // In production, you'd check against trusted IPs
    // For now, we'll allow all IPs in development
  }

  return true;
};

/**
 * ABAC Middleware - Context-aware authorization
 * Usage: requireABAC('account', 'read')
 */
export const requireABAC = (resourceType: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

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

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const userRoles = user.roles.map((ur) => ur.role.name);
      const userPermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      );

      // Get resource ID from params or body
      const resourceId = req.params.id || req.body.id || req.query.id;
      let resourceOwnerId: string | undefined;

      // Fetch resource to get owner if resourceId is provided
      if (resourceId && resourceType === 'account') {
        const account = await prisma.account.findUnique({
          where: { id: resourceId as string },
        });
        resourceOwnerId = account?.userId;
      } else if (resourceId && resourceType === 'customer') {
        resourceOwnerId = resourceId as string; // Customer ID is the user ID
      }

      // Build ABAC context
      const context: ABACContext = {
        user: {
          id: user.id,
          roles: userRoles,
          permissions: userPermissions,
        },
        resource: {
          type: resourceType,
          id: resourceId as string,
          ownerId: resourceOwnerId,
        },
        action,
        environment: {
          ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown',
          timeOfDay: new Date().getHours(),
          deviceInfo: req.headers['user-agent'],
        },
      };

      // Check ABAC policy
      const allowed = await checkABACPolicy(context);

      if (!allowed) {
        await prisma.auditLog.create({
          data: {
            userId: req.userId,
            action: 'ABAC_DENIED',
            resource: resourceType,
            resourceId: resourceId as string,
            status: 'BLOCKED',
            ipAddress: context.environment.ipAddress,
            userAgent: context.environment.deviceInfo,
            metadata: {
              context,
              reason: 'ABAC policy violation',
            },
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied by ABAC policy',
        });
      }

      // Store context in request for use in controllers
      (req as any).abacContext = context;
      next();
    } catch (error) {
      console.error('ABAC middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};


