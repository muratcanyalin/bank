import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';
import { generateDeviceFingerprint, getDeviceInfoString } from '../utils/deviceFingerprint';
import { calculateRiskScore, checkIPRestrictions } from '../utils/riskScoring';
import { getIpAddress } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * Zero-Trust Security Middleware
 * Implements "Never Trust, Always Verify" principle
 * 
 * Checks:
 * 1. Authentication (JWT)
 * 2. Authorization (RBAC/ABAC)
 * 3. Device fingerprint
 * 4. IP restrictions
 * 5. Risk scoring
 * 6. Session validity
 */
export const zeroTrustVerify = (options?: {
  requireMFA?: boolean;
  minRiskScore?: number;
  allowedRoles?: string[];
}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Step 1: Authentication check (should already be done by authenticate middleware)
      if (!req.userId || !req.user) {
        return res.status(401).json({ error: 'Unauthorized - Authentication required' });
      }

      const userId = req.userId;
      const ipAddress = getIpAddress(req);
      const deviceFingerprint = generateDeviceFingerprint(req);

      // Step 2: IP Restrictions Check
      const ipCheck = await checkIPRestrictions(ipAddress, userId);
      if (!ipCheck.allowed) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'ZERO_TRUST_BLOCK',
            resource: req.path,
            status: 'BLOCKED',
            ipAddress,
            userAgent: req.headers['user-agent'],
            deviceInfo: getDeviceInfoString(req),
            metadata: {
              reason: ipCheck.reason,
              type: 'IP_RESTRICTION',
            },
          },
        });

        return res.status(403).json({
          error: 'Access denied',
          message: ipCheck.reason || 'IP restriction violation',
        });
      }

      // Step 3: Device Fingerprint Verification
      // TEMPORARILY DISABLED FOR DEVELOPMENT
      // TODO: Re-enable in production
      /*
      const currentSession = await prisma.session.findFirst({
        where: {
          userId,
          token: req.headers.authorization?.substring(7),
        },
      });

      if (currentSession) {
        // Get device info from session (stored as readable string, not hash)
        const sessionDeviceInfo = currentSession.deviceInfo || '';
        const currentDeviceInfo = getDeviceInfoString(req);
        
        // Extract user agent from both for comparison
        const sessionUserAgent = sessionDeviceInfo.split('|')[0] || '';
        const currentUserAgent = req.headers['user-agent'] || '';
        
        // More lenient check: only block if user agent is completely different
        // (allows for minor header changes that don't indicate hijacking)
        if (
          sessionDeviceInfo &&
          sessionUserAgent &&
          currentUserAgent &&
          !sessionUserAgent.includes(currentUserAgent.substring(0, 20)) &&
          !currentUserAgent.includes(sessionUserAgent.substring(0, 20)) &&
          sessionDeviceInfo.length > 10
        ) {
          // Device mismatch - might be session hijacking
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'ZERO_TRUST_BLOCK',
              resource: req.path,
              status: 'BLOCKED',
              ipAddress,
              userAgent: req.headers['user-agent'],
              deviceInfo: getDeviceInfoString(req),
              metadata: {
                reason: 'Device fingerprint mismatch',
                type: 'DEVICE_VERIFICATION',
                sessionUserAgent: sessionUserAgent.substring(0, 50),
                currentUserAgent: currentUserAgent.substring(0, 50),
              },
            },
          });

          return res.status(403).json({
            error: 'Access denied',
            message: 'Device verification failed',
          });
        }
      }
      */
      
      // Get session for later use (session validity check)
      const currentSession = await prisma.session.findFirst({
        where: {
          userId,
          token: req.headers.authorization?.substring(7),
        },
      });

      // Step 4: MFA Check (if required)
      if (options?.requireMFA) {
        const mfaSecret = await prisma.mfaSecret.findUnique({
          where: { userId },
        });

        if (!mfaSecret || !mfaSecret.enabled) {
          return res.status(403).json({
            error: 'MFA required',
            message: 'This action requires MFA to be enabled',
          });
        }
      }

      // Step 5: Role Check (if specified)
      if (options?.allowedRoles && options.allowedRoles.length > 0) {
        const userRoles = req.user.roles?.map((ur: any) => ur.role.name) || [];
        const hasAllowedRole = options.allowedRoles.some((role) =>
          userRoles.includes(role)
        );

        if (!hasAllowedRole) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Insufficient role privileges',
          });
        }
      }

      // Step 6: Risk Scoring
      const action = req.method + ' ' + req.path;
      const resource = req.path.split('/')[2] || 'unknown';
      const amount = req.body?.amount || req.query?.amount;

      const riskContext = {
        userId,
        action,
        resource,
        ipAddress,
        deviceFingerprint,
        timeOfDay: new Date().getHours(),
        amount: amount ? parseFloat(amount) : undefined,
      };

      const riskScore = await calculateRiskScore(riskContext);

      // Log risk assessment
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'RISK_ASSESSMENT',
          resource: req.path,
          status: riskScore.recommendation === 'BLOCK' ? 'BLOCKED' : 'SUCCESS',
          ipAddress,
          userAgent: req.headers['user-agent'],
          deviceInfo: getDeviceInfoString(req),
          metadata: {
            riskScore: riskScore.score,
            factors: riskScore.factors,
            recommendation: riskScore.recommendation,
          },
        },
      });

      // Block if risk is too high
      if (riskScore.recommendation === 'BLOCK') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'High risk activity detected',
          riskScore: riskScore.score,
          factors: riskScore.factors,
        });
      }

      // Require additional verification for high-risk actions
      if (riskScore.recommendation === 'REVIEW' && options?.minRiskScore) {
        if (riskScore.score >= options.minRiskScore) {
          return res.status(403).json({
            error: 'Additional verification required',
            message: 'This action requires additional verification',
            riskScore: riskScore.score,
          });
        }
      }

      // Step 7: Session Validity Check
      if (currentSession) {
        // Check if session is expired
        if (currentSession.expiresAt < new Date()) {
          return res.status(401).json({
            error: 'Session expired',
            message: 'Please login again',
          });
        }

        // Update last activity
        await prisma.session.update({
          where: { id: currentSession.id },
          data: { lastActivity: new Date() },
        });
      }

      // Store risk context in request for use in controllers
      (req as any).riskScore = riskScore;
      (req as any).deviceFingerprint = deviceFingerprint;

      next();
    } catch (error) {
      console.error('Zero-Trust middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};


