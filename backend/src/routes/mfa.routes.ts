import { Router } from 'express';
import {
  generateSecret,
  verifyAndEnable,
  verifyLogin,
  disable,
} from '../controllers/mfa.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/generate', authenticate, generateSecret);
router.post('/verify-enable', authenticate, verifyAndEnable);
router.post('/verify-login', verifyLogin);
router.post('/disable', authenticate, disable);

export default router;


