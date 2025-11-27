import { Router } from 'express';
import {
  getAccountBalance,
  getAccountSummary,
  getAllBalances,
} from '../controllers/balance.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All balance routes require authentication
router.use(authenticate);

// Get account balance - requires account:read permission
router.get('/account/:id', requirePermission('account:read'), getAccountBalance);

// Get account summary - requires account:read permission
router.get('/account/:id/summary', requirePermission('account:read'), getAccountSummary);

// Get all balances - requires account:read permission
router.get('/', requirePermission('account:read'), getAllBalances);

export default router;

