import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RiskContext {
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  deviceFingerprint: string;
  timeOfDay: number;
  amount?: number;
  previousFailures?: number;
}

export interface RiskScore {
  score: number; // 0-100, higher = more risky
  factors: string[];
  recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK';
}

/**
 * Calculate risk score for an action
 * Zero-Trust approach: Always verify, never trust
 */
export const calculateRiskScore = async (
  context: RiskContext
): Promise<RiskScore> => {
  let score = 0;
  const factors: string[] = [];

  // Factor 1: Unusual time of day (outside 6 AM - 10 PM)
  if (context.timeOfDay < 6 || context.timeOfDay > 22) {
    score += 15;
    factors.push('Unusual time of day');
  }

  // Factor 2: New device fingerprint
  const previousSessions = await prisma.session.findMany({
    where: {
      userId: context.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  const knownDevices = previousSessions.map((s) => s.deviceInfo || '');
  const isNewDevice = !knownDevices.some((d) =>
    d.includes(context.deviceFingerprint.substring(0, 16))
  );

  if (isNewDevice && previousSessions.length > 0) {
    score += 25;
    factors.push('New device detected');
  }

  // Factor 3: Recent failed login attempts
  const recentFailures = await prisma.auditLog.count({
    where: {
      userId: context.userId,
      action: 'LOGIN',
      status: 'FAILED',
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentFailures > 0) {
    score += recentFailures * 10;
    factors.push(`${recentFailures} recent failed login attempts`);
  }

  // Factor 4: High-value transaction
  if (context.amount && context.amount > 100000) {
    score += 20;
    factors.push('High-value transaction');
  }

  // Factor 5: Unusual IP address
  const previousIPs = await prisma.session.findMany({
    where: {
      userId: context.userId,
    },
    select: {
      ipAddress: true,
    },
    distinct: ['ipAddress'],
    take: 5,
  });

  const knownIPs = previousIPs.map((s) => s.ipAddress || '');
  const isNewIP = !knownIPs.includes(context.ipAddress);

  if (isNewIP && knownIPs.length > 0) {
    score += 15;
    factors.push('New IP address');
  }

  // Factor 6: Rapid successive actions
  const recentActions = await prisma.auditLog.count({
    where: {
      userId: context.userId,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
  });

  if (recentActions > 10) {
    score += 20;
    factors.push('Rapid successive actions');
  }

  // Factor 7: Sensitive action (customer data access, high-value transfer)
  if (context.resource === 'customer' || (context.amount && context.amount > 50000)) {
    score += 10;
    factors.push('Sensitive action');
  }

  // Determine recommendation
  let recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK';
  if (score >= 70) {
    recommendation = 'BLOCK';
  } else if (score >= 40) {
    recommendation = 'REVIEW';
  } else {
    recommendation = 'ALLOW';
  }

  return {
    score: Math.min(score, 100),
    factors,
    recommendation,
  };
};

/**
 * Check if IP is in whitelist or blacklist
 */
export const checkIPRestrictions = async (
  ipAddress: string,
  userId?: string
): Promise<{ allowed: boolean; reason?: string }> => {
  // In production, this would check against database or external service
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];

  // Check blacklist
  if (blacklistedIPs.includes(ipAddress)) {
    return { allowed: false, reason: 'IP is blacklisted' };
  }

  // If whitelist exists and IP is not in it, deny
  if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(ipAddress)) {
    return { allowed: false, reason: 'IP is not whitelisted' };
  }

  // Check for suspicious patterns (simple example)
  // In production, use more sophisticated IP reputation services
  if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
    // Private IP - might be VPN or proxy, increase scrutiny
    // For now, allow but flag for review
  }

  return { allowed: true };
};


