import { Router } from 'express';
import {
  getTransactionHistory,
  getTransactionDetails,
  cancelTransaction,
} from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// Get transaction history - requires transaction:read permission
router.get('/', requirePermission('transaction:read'), getTransactionHistory);

// Get transaction details - requires transaction:read permission
router.get('/:id', requirePermission('transaction:read'), getTransactionDetails);

// Cancel transaction - requires transaction:read permission (users can cancel their own)
router.post('/:id/cancel', requirePermission('transaction:read'), cancelTransaction);

export default router;


