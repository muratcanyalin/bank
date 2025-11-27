import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateMFASecret = async (userId: string, email: string) => {
  const issuer = process.env.MFA_ISSUER || 'Mini Banking Platform';
  
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${email})`,
    issuer,
  });

  // Save secret to database
  await prisma.mfaSecret.upsert({
    where: { userId },
    create: {
      userId,
      secret: secret.base32,
      enabled: false,
    },
    update: {
      secret: secret.base32,
    },
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey: secret.base32,
  };
};

export const verifyMFAToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  const mfaSecret = await prisma.mfaSecret.findUnique({
    where: { userId },
  });

  if (!mfaSecret || !mfaSecret.enabled) {
    return false;
  }

  const verified = speakeasy.totp.verify({
    secret: mfaSecret.secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) before/after
  });

  return verified === true;
};

export const enableMFA = async (userId: string) => {
  await prisma.mfaSecret.update({
    where: { userId },
    data: { enabled: true },
  });
};

export const disableMFA = async (userId: string) => {
  await prisma.mfaSecret.update({
    where: { userId },
    data: { enabled: false },
  });
};


