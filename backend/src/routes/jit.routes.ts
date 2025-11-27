import { Router } from 'express';
import {
  requestAccess,
  useAccess,
  revokeAccess,
} from '../controllers/jit.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// All JIT routes require authentication and employee/admin role
router.use(authenticate);
router.use(requireRole('EMPLOYEE'));

router.post('/request', requestAccess);
router.post('/use', useAccess);
router.post('/revoke', revokeAccess);

export default router;


