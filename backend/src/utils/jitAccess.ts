import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface JITAccessRequest {
  userId: string;
  resource: string;
  resourceId: string;
  action: string;
  reason: string;
  duration?: number; // minutes
}

export interface JITAccessGrant {
  id: string;
  token: string;
  expiresAt: Date;
  resource: string;
  resourceId: string;
  action: string;
}

/**
 * Just-In-Time Access (JIT)
 * Grants temporary access to resources on-demand
 * 
 * Example: Employee needs to access customer data for a specific task
 * Instead of permanent access, grant temporary access with expiration
 */
export const requestJITAccess = async (
  request: JITAccessRequest
): Promise<JITAccessGrant> => {
  const duration = request.duration || 30; // Default 30 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + duration);

  const token = uuidv4();

  // Store JIT access grant
  // In production, use a separate table for JIT grants
  // For now, we'll use audit log to track it
  await prisma.auditLog.create({
    data: {
      userId: request.userId,
      action: 'JIT_ACCESS_REQUEST',
      resource: request.resource,
      resourceId: request.resourceId,
      status: 'SUCCESS',
      metadata: {
        jitToken: token,
        expiresAt: expiresAt.toISOString(),
        reason: request.reason,
        action: request.action,
      },
    },
  });

  return {
    id: uuidv4(),
    token,
    expiresAt,
    resource: request.resource,
    resourceId: request.resourceId,
    action: request.action,
  };
};

/**
 * Verify JIT access token
 */
export const verifyJITAccess = async (
  token: string,
  userId: string,
  resource: string,
  resourceId: string,
  action: string
): Promise<boolean> => {
  // Find JIT access grant in audit logs
  // Note: Prisma JSON filtering is limited, so we fetch and filter in memory
  const jitGrants = await prisma.auditLog.findMany({
    where: {
      userId,
      action: 'JIT_ACCESS_REQUEST',
      resource,
      resourceId,
      status: 'SUCCESS',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // Filter by token in metadata
  const jitGrant = jitGrants.find((grant) => {
    const metadata = grant.metadata as any;
    return metadata?.jitToken === token;
  });

  if (!jitGrant) {
    return false;
  }

  // Check expiration
  const metadata = jitGrant.metadata as any;
  if (metadata?.expiresAt) {
    const expiresAt = new Date(metadata.expiresAt);
    if (expiresAt < new Date()) {
      return false;
    }
  }

  // Check if action matches
  if (metadata?.action !== action) {
    return false;
  }

  // Log JIT access usage
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'JIT_ACCESS_USED',
      resource,
      resourceId,
      status: 'SUCCESS',
      metadata: {
        jitToken: token,
        originalRequestId: jitGrant.id,
      },
    },
  });

  return true;
};

/**
 * Revoke JIT access
 */
export const revokeJITAccess = async (
  token: string,
  userId: string
): Promise<void> => {
  // Mark as revoked in audit log
  // Find grants with this token
  const jitGrants = await prisma.auditLog.findMany({
    where: {
      userId,
      action: 'JIT_ACCESS_REQUEST',
    },
    take: 100, // Limit for performance
  });

  const grantsToRevoke = jitGrants.filter((grant) => {
    const metadata = grant.metadata as any;
    return metadata?.jitToken === token;
  });

  // Update each grant
  for (const grant of grantsToRevoke) {
    await prisma.auditLog.update({
      where: { id: grant.id },
      data: {
        status: 'REVOKED',
      },
    });
  }
};

