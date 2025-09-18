import { PrismaClient } from './generated/client';

// Database clients for each service
export interface DatabaseConfig {
  url: string;
  logLevel?: ('query' | 'info' | 'warn' | 'error')[];
  maxConnections?: number;
  timeout?: number;
}

class DatabaseClientFactory {
  private clients: Map<string, PrismaClient> = new Map();

  /**
   * Get or create a Prisma client for a specific service
   * Each service gets its own client instance with proper connection pooling
   */
  getClient(serviceName: string, config: DatabaseConfig): PrismaClient {
    if (this.clients.has(serviceName)) {
      return this.clients.get(serviceName)!;
    }

    const client = new PrismaClient({
      datasources: {
        db: {
          url: config.url,
        },
      },
      log: config.logLevel || ['error', 'warn'],
      transactionOptions: {
        timeout: config.timeout || 10000,
        maxWait: 2000,
      },
    });

    this.clients.set(serviceName, client);
    return client;
  }

  /**
   * Disconnect all clients (useful for graceful shutdown)
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(
      (client) => client.$disconnect()
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
  }

  /**
   * Get client for Identity Service
   */
  getIdentityClient(): PrismaClient {
    return this.getClient('identity', {
      url: process.env.IDENTITY_DATABASE_URL || process.env.DATABASE_URL!,
      logLevel: ['error', 'warn', 'info'],
    });
  }

  /**
   * Get client for Tenant Service
   */
  getTenantClient(): PrismaClient {
    return this.getClient('tenant', {
      url: process.env.TENANT_DATABASE_URL || process.env.DATABASE_URL!,
      logLevel: ['error', 'warn', 'info'],
    });
  }

  /**
   * Get client for Billing Service
   */
  getBillingClient(): PrismaClient {
    return this.getClient('billing', {
      url: process.env.BILLING_DATABASE_URL || process.env.DATABASE_URL!,
      logLevel: ['error', 'warn', 'info'],
    });
  }

  /**
   * Get client for Notification Service
   */
  getNotificationClient(): PrismaClient {
    return this.getClient('notification', {
      url: process.env.NOTIFICATION_DATABASE_URL || process.env.DATABASE_URL!,
      logLevel: ['error', 'warn', 'info'],
    });
  }

  /**
   * Get client for Reporting Service
   */
  getReportingClient(): PrismaClient {
    return this.getClient('reporting', {
      url: process.env.REPORTING_DATABASE_URL || process.env.DATABASE_URL!,
      logLevel: ['error', 'warn', 'info'],
    });
  }
}

// Singleton instance
export const dbFactory = new DatabaseClientFactory();

// Convenience exports
export const identityDb = () => dbFactory.getIdentityClient();
export const tenantDb = () => dbFactory.getTenantClient();
export const billingDb = () => dbFactory.getBillingClient();
export const notificationDb = () => dbFactory.getNotificationClient();
export const reportingDb = () => dbFactory.getReportingClient();

// Multi-tenant utilities
export interface TenantContext {
  tenantId: string;
  userId?: string;
}

/**
 * Create a Prisma client with tenant context middleware
 * Automatically filters queries by tenantId when applicable
 */
export function createTenantAwareClient(
  client: PrismaClient,
  tenantContext: TenantContext
): PrismaClient {
  // Add middleware to automatically inject tenantId
  client.$use(async (params, next) => {
    // Models that support multi-tenancy
    const tenantModels = [
      'user',
      'subscription',
      'invoice',
      'notification',
      'report',
      'auditLog',
      'apiKey',
      'file'
    ];

    if (tenantModels.includes(params.model?.toLowerCase() || '')) {
      if (params.action === 'create') {
        // Inject tenantId for create operations
        if (params.args.data && !params.args.data.tenantId) {
          params.args.data.tenantId = tenantContext.tenantId;
        }
      } else if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(params.action)) {
        // Filter by tenantId for read operations
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};

        // Only add tenantId filter if not already specified
        if (params.args.where.tenantId === undefined) {
          params.args.where.tenantId = tenantContext.tenantId;
        }
      } else if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
        // Filter by tenantId for update/delete operations
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};

        if (params.args.where.tenantId === undefined) {
          params.args.where.tenantId = tenantContext.tenantId;
        }
      }
    }

    return next(params);
  });

  return client;
}

// Transaction helpers
export async function withTransaction<T>(
  client: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return client.$transaction(fn);
}

// Health check
export async function checkDatabaseHealth(client: PrismaClient): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}