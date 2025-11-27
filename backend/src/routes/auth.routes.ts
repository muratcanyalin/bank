import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { antiBruteforce, progressiveDelay } from '../middleware/antiBruteforce';
import { validationRules, handleValidationErrors } from '../middleware/inputValidation';

const router = Router();

// Apply rate limiting and anti-bruteforce to auth endpoints
router.post(
  '/register',
  authRateLimiter,
  [
    validationRules.email,
    validationRules.password,
    validationRules.firstName,
    validationRules.lastName,
    validationRules.phoneNumber,
    handleValidationErrors,
  ],
  register
);

router.post(
  '/login',
  authRateLimiter,
  antiBruteforce(5, 15, 15), // 5 attempts, 15 min block, 15 min window
  progressiveDelay(),
  [
    validationRules.email,
    handleValidationErrors,
  ],
  login
);

router.post('/refresh', authRateLimiter, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;

