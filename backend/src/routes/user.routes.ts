import { Router } from 'express';
import {
  updateProfile,
  changePassword,
  verifySMSCode,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Update profile
router.patch('/profile', updateProfile);

// Change password
router.post('/change-password', changePassword);

// Verify SMS code
router.post('/verify-sms', verifySMSCode);

export default router;

