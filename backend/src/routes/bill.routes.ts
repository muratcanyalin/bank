import { Router } from 'express';
import {
  getBillProviders,
  queryBill,
  getUserBills,
} from '../controllers/bill.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get bill providers - public (for selecting providers)
router.get('/providers', getBillProviders);

// All other routes require authentication
router.use(authenticate);

// Query bill by subscriber number
router.post('/query', queryBill);

// Get user's bills
router.get('/', getUserBills);

export default router;

