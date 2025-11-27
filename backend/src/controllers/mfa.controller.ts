import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import {
  generateMFASecret,
  verifyMFAToken,
  enableMFA,
  disableMFA,
} from '../utils/mfa';
import {
  generateAccessToken,
  generateRefreshToken,
  getDeviceInfo,
  getIpAddress,
} from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateSecret = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email } = req.user;
    const mfaData = await generateMFASecret(req.userId, email);

    res.json({
      message: 'MFA secret generated',
      ...mfaData,
    });
  } catch (error) {
    console.error('Generate MFA secret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyAndEnable = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const isValid = await verifyMFAToken(req.userId, token);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }

    await enableMFA(req.userId);

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('Enable MFA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { token, tempToken } = req.body;

    if (!token || !tempToken) {
      return res.status(400).json({
        error: 'Token and tempToken are required',
      });
    }

    // Verify temp token to get userId
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(tempToken, jwtSecret) as {
      userId: string;
      email: string;
    };

    const isValid = await verifyMFAToken(decoded.userId, token);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }

    // Generate real tokens and create session (similar to login)
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.session.create({
      data: {
        userId: decoded.userId,
        token: accessToken,
        refreshToken,
        deviceInfo: getDeviceInfo(req),
        ipAddress: getIpAddress(req),
        userAgent: req.headers['user-agent'],
        expiresAt,
      },
    });

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: decoded.userId,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.json({
      message: 'MFA verified, login successful',
      accessToken,
      refreshToken,
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        roles: user?.roles.map((ur: any) => ur.role.name),
      },
    });
  } catch (error) {
    console.error('Verify MFA login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const disable = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await disableMFA(req.userId);

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

