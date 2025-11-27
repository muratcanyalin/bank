import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  getDeviceInfo,
  getIpAddress,
} from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { AuditLogService } from '../services/auditLog.service';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Email, password, first name, and last name are required',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
      },
    });

    // Assign CUSTOMER role by default
    let customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });

    if (!customerRole) {
      customerRole = await prisma.role.create({
        data: {
          name: 'CUSTOMER',
          description: 'Customer role',
        },
      });
    }

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: customerRole.id,
      },
    });

    // Create account for new user
    const accountNumber = `TR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber,
        accountType: 'CHECKING',
        balance: 0,
      },
    });

    // Audit log
    await AuditLogService.logLogin(
      user.id,
      'SUCCESS',
      getIpAddress(req),
      req.headers['user-agent'] || '',
      getDeviceInfo(req),
      { action: 'REGISTER' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const mockMode = (req as any).mockMode;
    let user;

    if (mockMode) {
      // Mock login - accept any email/password for testing
      user = {
        id: 'mock-user-1',
        email: email,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
        roles: [
          {
            role: {
              name: 'CUSTOMER',
              permissions: [],
            },
          },
        ],
      };
    } else {
      // Find user in database
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        await AuditLogService.logLogin(
          undefined,
          'FAILED',
          getIpAddress(req),
          req.headers['user-agent'] || '',
          getDeviceInfo(req),
          { email, reason: 'User not found or inactive' }
        );
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        await AuditLogService.logLogin(
          user.id,
          'FAILED',
          getIpAddress(req),
          req.headers['user-agent'] || '',
          getDeviceInfo(req),
          { reason: 'Invalid password' }
        );
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Check MFA
    const mfaSecret = await prisma.mfaSecret.findUnique({
      where: { userId: user.id },
    });

    if (mfaSecret?.enabled) {
      // MFA required - return temporary token for MFA verification
      const tempToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      return res.json({
        message: 'MFA required',
        mfaRequired: true,
        tempToken,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken();

    // Create session
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        deviceInfo: getDeviceInfo(req),
        ipAddress: getIpAddress(req),
        userAgent: req.headers['user-agent'],
        expiresAt,
      },
    });

    // Create refresh token record
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    // Audit log
    await AuditLogService.logLogin(
      user.id,
      'SUCCESS',
      getIpAddress(req),
      req.headers['user-agent'] || '',
      getDeviceInfo(req)
    );

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.revoked ||
      tokenRecord.expiresAt < new Date() ||
      !tokenRecord.user.isActive
    ) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
    });

    // Update session
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.session.updateMany({
      where: {
        userId: tokenRecord.user.id,
        refreshToken,
      },
      data: {
        token: accessToken,
        expiresAt,
        lastActivity: new Date(),
      },
    });

    res.json({
      accessToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token && req.userId) {
      // Revoke session
      await prisma.session.deleteMany({
        where: {
          userId: req.userId,
          token,
        },
      });

      // Revoke refresh token
      const { refreshToken } = req.body;
      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: {
            userId: req.userId,
            token: refreshToken,
          },
          data: {
            revoked: true,
          },
        });
      }

      // Audit log
      await AuditLogService.logLogout(
        req.userId,
        getIpAddress(req),
        req.headers['user-agent'] || '',
        getDeviceInfo(req)
      );
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
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
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

