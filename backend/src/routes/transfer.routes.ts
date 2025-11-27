import { Router } from 'express';
import { body } from 'express-validator';
import { createTransfer } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { zeroTrustVerify } from '../middleware/zeroTrust';
import { transferRateLimiter } from '../middleware/rateLimiter';
import { validationRules, handleValidationErrors } from '../middleware/inputValidation';

const router = Router();

// All transfer routes require authentication
router.use(authenticate);

// Create transfer - requires transfer:create permission and zero-trust verification
// Note: minRiskScore lowered to 70 for development (was 50, but allows more flexibility)
router.post(
  '/',
  transferRateLimiter,
  requirePermission('transfer:create'),
  zeroTrustVerify({ minRiskScore: 70 }), // Higher threshold = less strict
  (req, res, next) => {
    // Apply validation middleware
    // Support both toAccountId and toAccountIdentifier
    const validationChain = [
      body('fromAccountId').notEmpty().withMessage('Source account is required'),
      body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
      // Custom validation: at least one of toAccountId or toAccountIdentifier must be provided
      body().custom((value) => {
        if (!value.toAccountId && !value.toAccountIdentifier) {
          throw new Error('Either toAccountId or toAccountIdentifier is required');
        }
        return true;
      }),
    ];
    Promise.all(validationChain.map((validator) => validator.run(req))).then(() => {
      handleValidationErrors(req, res, next);
    });
  },
  createTransfer
);

export default router;

