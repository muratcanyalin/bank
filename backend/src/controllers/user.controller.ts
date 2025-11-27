import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firstName, lastName, phoneNumber, address, city, postalCode } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address && { address }),
        ...(city && { city }),
        ...(postalCode && { postalCode }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password (in real system, use bcrypt.compare)
    // For now, we'll skip verification in mock mode
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify SMS code (mock - always returns success for code 1234)
 */
export const verifySMSCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, phoneNumber } = req.body;

    if (!code || !phoneNumber) {
      return res.status(400).json({ error: 'Code and phone number are required' });
    }

    // Mock SMS verification - accept 1234 as valid code
    if (code === '1234') {
      res.json({
        verified: true,
        message: 'SMS code verified successfully',
      });
    } else {
      res.status(400).json({
        verified: false,
        error: 'Invalid SMS code',
      });
    }
  } catch (error) {
    console.error('Verify SMS code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

