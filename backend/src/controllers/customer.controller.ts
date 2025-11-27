import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { getIpAddress, getDeviceInfo } from '../utils/jwt';
import { AuditLogService } from '../services/auditLog.service';

const prisma = new PrismaClient();

/**
 * Get customer data - Only accessible by employees with customer:view permission
 * This demonstrates the "Employee Access Customer Data" flow
 */
export const getCustomerData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customerId = req.params.id;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Get customer
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
            isActive: true,
            createdAt: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        accounts: true,
        roles: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Audit log - Employee viewing customer data
    await AuditLogService.logCustomerAccess(
      req.userId,
      customerId,
      'VIEW',
      getIpAddress(req),
      req.headers['user-agent'] || '',
      getDeviceInfo(req),
      {
        customerEmail: customer.email,
      }
    );

    res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
        emailVerified: customer.emailVerified,
        createdAt: customer.createdAt,
        accounts: customer.accounts,
        roles: customer.roles.map((ur) => ur.role.name),
      },
    });
  } catch (error) {
    console.error('Get customer data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List all customers - Only accessible by employees with customer:list permission
 */
export const listCustomers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          accounts: {
            select: {
              id: true,
              accountNumber: true,
              accountType: true,
              balance: true,
            },
          },
          roles: {
            include: {
              role: true,
            },
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
          accounts: true,
          roles: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    // Audit log
    await AuditLogService.logEmployeeActivity(
      req.userId,
      'LIST_CUSTOMERS',
      'customer',
      undefined,
      getIpAddress(req),
      req.headers['user-agent'] || '',
      getDeviceInfo(req),
      {
        page,
        limit,
        total,
      }
    );

    res.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        accountCount: customer.accounts.length,
        totalBalance: customer.accounts.reduce(
          (sum, acc) => sum + Number(acc.balance),
          0
        ),
        roles: customer.roles.map((ur) => ur.role.name),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update customer data - Only accessible by employees with customer:modify permission
 */
export const updateCustomerData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customerId = req.params.id;
    const { firstName, lastName, phoneNumber, isActive } = req.body;

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    await AuditLogService.logCustomerAccess(
      req.userId,
      customerId,
      'MODIFY',
      getIpAddress(req),
      req.headers['user-agent'] || '',
      getDeviceInfo(req),
      {
        changes: {
          firstName,
          lastName,
          phoneNumber,
          isActive,
        },
      }
    );

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

