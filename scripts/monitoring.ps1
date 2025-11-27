# Monitoring Setup Script

Write-Host "📊 Mini Banking Platform - Monitoring Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install monitoring dependencies
Write-Host "1. Installing monitoring packages..." -ForegroundColor Yellow
Set-Location backend
npm install --save winston morgan express-status-monitor
Set-Location ..
Write-Host "✅ Monitoring packages installed" -ForegroundColor Green
Write-Host ""

# Step 2: Create logging configuration
Write-Host "2. Creating logging configuration..." -ForegroundColor Yellow
$loggingConfig = @"
// backend/src/config/logging.ts
import winston from 'winston';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'banking-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
"@

$logDir = "backend\src\config"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$loggingConfig | Out-File -FilePath "$logDir\logging.ts" -Encoding UTF8

$logsDir = "backend\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Write-Host "✅ Logging configuration created" -ForegroundColor Green
Write-Host ""

# Step 3: Create monitoring dashboard config
Write-Host "3. Creating monitoring dashboard configuration..." -ForegroundColor Yellow
$monitoringConfig = @"
// backend/src/config/monitoring.ts
import expressStatusMonitor from 'express-status-monitor';

export const statusMonitor = expressStatusMonitor({
  title: 'Banking API Status',
  path: '/status',
  spans: [
    { interval: 1, retention: 60 },   // 1 minute
    { interval: 5, retention: 60 },   // 5 minutes
    { interval: 15, retention: 60 },  // 15 minutes
  ],
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    responseTime: true,
    rps: true,
    statusCodes: true,
  },
  healthChecks: [
    {
      protocol: 'http',
      host: 'localhost',
      path: '/health',
      port: process.env.PORT || 3001,
    },
  ],
});
"@

$monitoringConfig | Out-File -FilePath "$logDir\monitoring.ts" -Encoding UTF8
Write-Host "✅ Monitoring configuration created" -ForegroundColor Green
Write-Host ""

# Step 4: Create Prometheus metrics (optional)
Write-Host "4. Prometheus metrics (optional)..." -ForegroundColor Yellow
Write-Host "   Install: npm install prom-client" -ForegroundColor White
Write-Host "   See: backend/src/config/metrics.ts (to be created)" -ForegroundColor White
Write-Host ""

# Step 5: Create health check endpoint enhancement
Write-Host "5. Enhanced health check..." -ForegroundColor Yellow
$healthCheck = @"
// backend/src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    },
  };

  try {
    await prisma.\$queryRaw\`SELECT 1\`;
    health.checks.database = 'connected';
  } catch (error) {
    health.checks.database = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
"@

$healthRoute = "backend\src\routes\health.routes.ts"
$healthCheck | Out-File -FilePath $healthRoute -Encoding UTF8
Write-Host "✅ Enhanced health check created" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "✅ Monitoring setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Available endpoints:" -ForegroundColor Cyan
Write-Host "   - /health - Health check" -ForegroundColor White
Write-Host "   - /status - Status monitor dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs location: backend/logs/" -ForegroundColor Cyan
Write-Host ""


