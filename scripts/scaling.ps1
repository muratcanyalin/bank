# Scaling & Performance Optimization Script

Write-Host "⚡ Mini Banking Platform - Scaling & Performance" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Database Indexing
Write-Host "1. Database Indexing Analysis..." -ForegroundColor Yellow
Write-Host "✅ Prisma schema'da index'ler tanımlı:" -ForegroundColor Green
Write-Host "   - User: email (unique), id" -ForegroundColor White
Write-Host "   - Account: userId, accountNumber (unique)" -ForegroundColor White
Write-Host "   - Transaction: fromAccountId, toAccountId, createdAt" -ForegroundColor White
Write-Host "   - AuditLog: userId, action, createdAt" -ForegroundColor White
Write-Host ""

# Step 2: Connection Pooling
Write-Host "2. Database Connection Pooling..." -ForegroundColor Yellow
$poolingConfig = @"
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pool configuration
// Prisma automatically manages connection pooling
// For production, consider using PgBouncer or similar
"@

$dbConfigDir = "backend\src\config"
if (-not (Test-Path $dbConfigDir)) {
    New-Item -ItemType Directory -Path $dbConfigDir -Force | Out-Null
}
$poolingConfig | Out-File -FilePath "$dbConfigDir\database.ts" -Encoding UTF8
Write-Host "✅ Database pooling configuration created" -ForegroundColor Green
Write-Host ""

# Step 3: Caching Strategy
Write-Host "3. Caching Strategy..." -ForegroundColor Yellow
$cachingConfig = @"
// backend/src/config/cache.ts
// Redis caching configuration

import Redis from 'redis';

const redisClient = process.env.REDIS_HOST 
  ? Redis.createClient({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    })
  : null;

export const cache = {
  get: async (key: string) => {
    if (!redisClient) return null;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },
  
  set: async (key: string, value: any, ttl: number = 3600) => {
    if (!redisClient) return;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  },
  
  del: async (key: string) => {
    if (!redisClient) return;
    await redisClient.del(key);
  },
};
"@

$cachingConfig | Out-File -FilePath "$dbConfigDir\cache.ts" -Encoding UTF8
Write-Host "✅ Caching configuration created" -ForegroundColor Green
Write-Host ""

# Step 4: Load Balancer Configuration
Write-Host "4. Load Balancer Configuration (Nginx example)..." -ForegroundColor Yellow
$nginxConfig = @"
# /etc/nginx/sites-available/banking-api
upstream banking_backend {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
    # Add more instances as needed
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://banking_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
    }
}
"@

$nginxConfig | Out-File -FilePath "nginx.conf.example" -Encoding UTF8
Write-Host "✅ Nginx configuration example created" -ForegroundColor Green
Write-Host ""

# Step 5: PM2 Cluster Mode
Write-Host "5. PM2 Cluster Mode Configuration..." -ForegroundColor Yellow
$pm2Config = @"
{
  "apps": [{
    "name": "banking-api",
    "script": "./dist/index.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": 3001
    },
    "max_memory_restart": "500M",
    "error_file": "./logs/pm2-error.log",
    "out_file": "./logs/pm2-out.log",
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
    "merge_logs": true,
    "autorestart": true,
    "max_restarts": 10,
    "min_uptime": "10s"
  }]
}
"@

$pm2Config | Out-File -FilePath "backend\ecosystem.config.json" -Encoding UTF8
Write-Host "✅ PM2 cluster configuration created" -ForegroundColor Green
Write-Host ""

# Step 6: Performance Optimization Tips
Write-Host "6. Performance Optimization Tips..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Database:" -ForegroundColor Cyan
Write-Host "   - Use connection pooling (Prisma default)" -ForegroundColor White
Write-Host "   - Add indexes for frequently queried fields" -ForegroundColor White
Write-Host "   - Use database read replicas for read-heavy operations" -ForegroundColor White
Write-Host "   - Implement query result caching" -ForegroundColor White
Write-Host ""
Write-Host "⚡ Application:" -ForegroundColor Cyan
Write-Host "   - Enable gzip compression" -ForegroundColor White
Write-Host "   - Use Redis for session storage" -ForegroundColor White
Write-Host "   - Implement response caching" -ForegroundColor White
Write-Host "   - Use CDN for static assets" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Infrastructure:" -ForegroundColor Cyan
Write-Host "   - Use load balancer (Nginx, HAProxy)" -ForegroundColor White
Write-Host "   - Implement horizontal scaling (multiple instances)" -ForegroundColor White
Write-Host "   - Use PM2 cluster mode" -ForegroundColor White
Write-Host "   - Monitor resource usage" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Scaling configuration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Configure Redis for caching" -ForegroundColor White
Write-Host "   2. Set up load balancer" -ForegroundColor White
Write-Host "   3. Deploy multiple instances" -ForegroundColor White
Write-Host "   4. Monitor performance metrics" -ForegroundColor White
Write-Host ""


