import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'REVOKED';
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit Log Service
 * Centralized service for creating audit logs
 */
export class AuditLogService {
  /**
   * Create audit log entry
   */
  static async create(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          status: data.status,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          deviceInfo: data.deviceInfo,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error('Audit log creation error:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Log login attempt
   */
  static async logLogin(
    userId: string | undefined,
    status: 'SUCCESS' | 'FAILED',
    ipAddress: string,
    userAgent: string,
    deviceInfo: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      userId,
      action: 'LOGIN',
      status,
      ipAddress,
      userAgent,
      deviceInfo,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log logout
   */
  static async logLogout(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceInfo: string
  ): Promise<void> {
    await this.create({
      userId,
      action: 'LOGOUT',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      deviceInfo,
    });
  }

  /**
   * Log customer data access
   */
  static async logCustomerAccess(
    employeeId: string,
    customerId: string,
    action: 'VIEW' | 'MODIFY' | 'LIST',
    ipAddress: string,
    userAgent: string,
    deviceInfo: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      userId: employeeId,
      action: `CUSTOMER_${action}`,
      resource: 'customer',
      resourceId: customerId,
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      deviceInfo,
      metadata: {
        customerId,
        ...metadata,
      },
    });
  }

  /**
   * Log transfer
   */
  static async logTransfer(
    userId: string,
    transactionId: string,
    amount: number,
    fromAccountId: string,
    toAccountId: string,
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED',
    ipAddress: string,
    userAgent: string,
    deviceInfo: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      userId,
      action: 'TRANSFER',
      resource: 'transaction',
      resourceId: transactionId,
      status,
      ipAddress,
      userAgent,
      deviceInfo,
      metadata: {
        amount,
        fromAccountId,
        toAccountId,
        ...metadata,
      },
    });
  }

  /**
   * Log failed access attempt
   */
  static async logFailedAccess(
    userId: string | undefined,
    action: string,
    resource: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
    deviceInfo: string
  ): Promise<void> {
    await this.create({
      userId,
      action,
      resource,
      status: 'FAILED',
      ipAddress,
      userAgent,
      deviceInfo,
      metadata: {
        reason,
        blocked: true,
      },
    });
  }

  /**
   * Log permission denied
   */
  static async logPermissionDenied(
    userId: string,
    requiredPermission: string,
    ipAddress: string,
    userAgent: string,
    deviceInfo: string
  ): Promise<void> {
    await this.create({
      userId,
      action: 'PERMISSION_DENIED',
      resource: requiredPermission,
      status: 'BLOCKED',
      ipAddress,
      userAgent,
      deviceInfo,
      metadata: {
        requiredPermission,
      },
    });
  }

  /**
   * Log employee activity
   */
  static async logEmployeeActivity(
    employeeId: string,
    action: string,
    resource: string,
    resourceId: string | undefined,
    ipAddress: string,
    userAgent: string,
    deviceInfo: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.create({
      userId: employeeId,
      action: `EMPLOYEE_${action}`,
      resource,
      resourceId,
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      deviceInfo,
      metadata: {
        employeeId,
        ...metadata,
      },
    });
  }
}


