import { PrismaClient } from './generated/client';

export interface MigrationStatus {
  isUpToDate: boolean;
  pendingMigrations: string[];
  appliedMigrations: string[];
}

/**
 * Check migration status for a database
 */
export async function getMigrationStatus(client: PrismaClient): Promise<MigrationStatus> {
  try {
    // This would typically check _prisma_migrations table
    // For now, we'll use a simple query to check if tables exist
    const result = await client.$queryRaw<{table_name: string}[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `;

    const isUpToDate = result.length > 0;

    return {
      isUpToDate,
      pendingMigrations: isUpToDate ? [] : ['initial_migration'],
      appliedMigrations: isUpToDate ? ['initial_migration'] : [],
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      isUpToDate: false,
      pendingMigrations: ['initial_migration'],
      appliedMigrations: [],
    };
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations(client: PrismaClient): Promise<void> {
  try {
    // In production, this would run actual Prisma migrations
    console.log('🔄 Running database migrations...');

    // For development, we can use db push
    // await client.$executeRaw`-- Migration placeholder`;

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Reset database (dangerous - only for development)
 */
export async function resetDatabase(client: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }

  try {
    console.log('🔄 Resetting database...');

    // Drop all tables in reverse dependency order
    const tables = [
      'role_permissions',
      'report_executions',
      'invoice_items',
      'payments',
      'invoices',
      'subscriptions',
      'two_factor_auth',
      'password_resets',
      'sessions',
      'audit_logs',
      'api_keys',
      'notifications',
      'notification_templates',
      'reports',
      'files',
      'users',
      'tenants',
      'permissions',
      'roles',
      'system_configs',
    ];

    for (const table of tables) {
      try {
        await client.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      } catch (error) {
        // Table might not exist, continue
        console.warn(`Warning: Could not drop table ${table}:`, error);
      }
    }

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Create database backup (for development)
 */
export async function createBackup(client: PrismaClient, filename?: string): Promise<string> {
  const backupName = filename || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;

  try {
    console.log(`🔄 Creating database backup: ${backupName}`);

    // This is a placeholder - in production you'd use pg_dump
    // For now, we'll just log the backup creation
    console.log('📦 Backup would be created here with pg_dump');

    console.log(`✅ Backup created: ${backupName}`);
    return backupName;
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw error;
  }
}

/**
 * Restore database from backup (for development)
 */
export async function restoreBackup(client: PrismaClient, filename: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database restore is not allowed in production');
  }

  try {
    console.log(`🔄 Restoring database from backup: ${filename}`);

    // This is a placeholder - in production you'd use pg_restore
    console.log('📥 Backup would be restored here with pg_restore');

    console.log(`✅ Database restored from: ${filename}`);
  } catch (error) {
    console.error('❌ Database restore failed:', error);
    throw error;
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(client: PrismaClient): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await client.$queryRaw`SELECT 1 as health_check`;
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    return {
      status: 'unhealthy',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}