import { Router } from 'express';
import {
  getAuditLogs,
  getAuditStats,
  getMyAuditLogs,
  getCustomerAccessLogs,
  getTransferLogs,
} from '../controllers/auditLog.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All audit log routes require authentication
router.use(authenticate);

// Get all audit logs (requires audit:read permission)
router.get('/', requirePermission('audit:read'), getAuditLogs);

// Get audit statistics (requires audit:read permission)
router.get('/stats', requirePermission('audit:read'), getAuditStats);

// Get user's own audit logs (no special permission needed)
router.get('/me', getMyAuditLogs);

// Get customer access logs (requires audit:read permission)
router.get('/customer-access', requirePermission('audit:read'), getCustomerAccessLogs);

// Get transfer logs with fraud detection (requires audit:read permission)
router.get('/transfers', requirePermission('audit:read'), getTransferLogs);

export default router;


