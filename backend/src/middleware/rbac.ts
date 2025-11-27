import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * RBAC Middleware - Checks if user has required permission
 * Usage: requirePermission('account:read')
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user with roles and permissions
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

      // Check if user has the required permission through any role
      const hasPermission = user.roles.some((userRole) =>
        userRole.role.permissions.some(
          (rolePermission) => rolePermission.permission.name === requiredPermission
        )
      );

      if (!hasPermission) {
        // Audit log for failed permission check
        await prisma.auditLog.create({
          data: {
            userId: req.userId,
            action: 'PERMISSION_DENIED',
            resource: requiredPermission,
            status: 'BLOCKED',
            ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'],
            metadata: {
              requiredPermission,
              userRoles: user.roles.map((ur) => ur.role.name),
            },
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have permission: ${requiredPermission}`,
        });
      }

      // Store user permissions in request for ABAC
      (req as any).userPermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      );

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * RBAC Middleware - Checks if user has any of the required permissions
 * Usage: requireAnyPermission(['account:read', 'account:write'])
 */
export const requireAnyPermission = (requiredPermissions: string[]) => {
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

      const userPermissions = user.roles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name)
      );

      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        await prisma.auditLog.create({
          data: {
            userId: req.userId,
            action: 'PERMISSION_DENIED',
            resource: requiredPermissions.join(' OR '),
            status: 'BLOCKED',
            ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'],
            metadata: {
              requiredPermissions,
              userRoles: user.roles.map((ur) => ur.role.name),
            },
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have any of the required permissions`,
        });
      }

      (req as any).userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * RBAC Middleware - Checks if user has a specific role
 * Usage: requireRole('ADMIN')
 */
export const requireRole = (requiredRole: string) => {
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
              role: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const hasRole = user.roles.some(
        (userRole) => userRole.role.name === requiredRole
      );

      if (!hasRole) {
        await prisma.auditLog.create({
          data: {
            userId: req.userId,
            action: 'ROLE_DENIED',
            resource: requiredRole,
            status: 'BLOCKED',
            ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'],
            metadata: {
              requiredRole,
              userRoles: user.roles.map((ur) => ur.role.name),
            },
          },
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have the required role: ${requiredRole}`,
        });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};


