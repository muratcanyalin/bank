import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit length
  return sanitized.substring(0, 10000);
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query as any);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validation error handler
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Common validation rules
 */
export const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

  password: body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must be at least 8 characters and contain uppercase, lowercase, and number'
    ),

  firstName: body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('First name must be 1-50 characters and contain only letters'),

  lastName: body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Last name must be 1-50 characters and contain only letters'),

  amount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),

  accountId: body('accountId')
    .isUUID()
    .withMessage('Invalid account ID format'),

  phoneNumber: body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
};


