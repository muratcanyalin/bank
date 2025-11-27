import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (): string => {
  return uuidv4();
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret) as TokenPayload;
};

export const getDeviceInfo = (req: any): string => {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  return `${userAgent}|${acceptLanguage}`;
};

export const getIpAddress = (req: any): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};


