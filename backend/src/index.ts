import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import mfaRoutes from './routes/mfa.routes';
import customerRoutes from './routes/customer.routes';
import accountRoutes from './routes/account.routes';
import transferRoutes from './routes/transfer.routes';
import jitRoutes from './routes/jit.routes';
import auditLogRoutes from './routes/auditLog.routes';
import transactionRoutes from './routes/transaction.routes';
import balanceRoutes from './routes/balance.routes';
import billRoutes from './routes/bill.routes';
import userRoutes from './routes/user.routes';
import { generalRateLimiter, authRateLimiter } from './middleware/rateLimiter';
import { antiBruteforce, progressiveDelay } from './middleware/antiBruteforce';
import { sanitizeInput } from './middleware/inputValidation';
import { addCSRFToken } from './middleware/csrf';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3002',
      'http://localhost:3000',
      'http://localhost:3002',
      process.env.MOBILE_URL || 'http://localhost:19006',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// CSRF token endpoint
app.use(addCSRFToken);

// General rate limiting (her zaman aktif)
app.use('/api', generalRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Banking API is running' });
});

// Database connection test
app.get('/api/test-db', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'ok', message: 'Database connected successfully' });
  } catch (error) {
    res.json({ 
      status: 'mock', 
      message: 'Database not available, running in mock mode',
      mockMode: true 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/jit', jitRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/user', userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

