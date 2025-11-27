import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * CSRF Token generation and validation
 * 
 * Note: For production, use a proper CSRF library like csurf
 * This is a simplified implementation for demonstration
 */

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing requests
 */
export const csrfProtection = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only protect state-changing methods
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (!protectedMethods.includes(req.method)) {
      return next();
    }

    // Skip CSRF check for API endpoints that use token-based auth
    // CSRF is mainly for cookie-based sessions
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    const token = req.headers[CSRF_TOKEN_HEADER.toLowerCase()] as string;
    const sessionToken = (req as any).session?.csrfToken;

    if (!token || token !== sessionToken) {
      return res.status(403).json({
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token',
      });
    }

    next();
  };
};

/**
 * Add CSRF token to response
 * In production, this would be handled by a session middleware
 */
export const addCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // For API with JWT, CSRF is less critical
  // But we can still add token generation endpoint
  if (req.path === '/api/csrf-token') {
    const token = generateCSRFToken();
    // In production, store in session
    res.json({ csrfToken: token });
  } else {
    next();
  }
};


