import { Router } from 'express';
import {
  getAccount,
  listAccounts,
  createAccount,
  updateAccount,
  deactivateAccount,
} from '../controllers/account.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { requireABAC } from '../middleware/abac';
import { accountCreationRateLimiter } from '../middleware/rateLimiter';
import { handleValidationErrors } from '../middleware/inputValidation';

const router = Router();

// All account routes require authentication
router.use(authenticate);

// Get specific account - Uses ABAC to check ownership
router.get('/:id', requireABAC('account', 'read'), getAccount);

// List user's accounts - requires account:read permission
router.get('/', requirePermission('account:read'), listAccounts);

// Create new account - requires account:create permission
router.post(
  '/',
  accountCreationRateLimiter,
  requirePermission('account:create'),
  handleValidationErrors,
  createAccount
);

// Update account - requires account:update permission
router.patch('/:id', requirePermission('account:update'), updateAccount);

// Deactivate account - requires account:update permission
router.post('/:id/deactivate', requirePermission('account:update'), deactivateAccount);

export default router;

