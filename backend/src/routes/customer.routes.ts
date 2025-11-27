import { Router } from 'express';
import {
  getCustomerData,
  listCustomers,
  updateCustomerData,
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Get specific customer data - requires customer:view permission
router.get('/:id', requirePermission('customer:view'), getCustomerData);

// List all customers - requires customer:list permission
router.get('/', requirePermission('customer:list'), listCustomers);

// Update customer data - requires customer:modify permission
router.patch('/:id', requirePermission('customer:modify'), updateCustomerData);

export default router;


