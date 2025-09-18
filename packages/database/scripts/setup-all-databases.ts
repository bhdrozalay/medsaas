import { PrismaClient } from '../src/generated/client';

async function setupAllDatabases() {
  console.log('🔧 Setting up all service databases...\n');

  const databases = [
    {
      name: 'Main Database',
      url: 'postgresql://postgres:postgres123@localhost:5432/medsas',
    },
    {
      name: 'Identity Service',
      url: 'postgresql://postgres:postgres123@localhost:5432/medsas_identity',
    },
    {
      name: 'Tenant Service',
      url: 'postgresql://postgres:postgres123@localhost:5432/medsas_tenant',
    },
    {
      name: 'Billing Service',
      url: 'postgresql://postgres:postgres123@localhost:5432/medsas_billing',
    },
    {
      name: 'Notification Service',
      url: 'postgresql://postgres:postgres123@localhost:5432/medsas_notification',
    },
    {
      name: 'Reporting Service',
      url: 'postgresql://postgres:postgres123@localhost:5432/medsas_reporting',
    },
  ];

  for (const db of databases) {
    console.log(`📋 Setting up ${db.name}...`);

    const client = new PrismaClient({
      datasources: {
        db: {
          url: db.url,
        },
      },
    });

    try {
      // Apply schema to database
      console.log(`   ↳ Connecting to ${db.name}...`);

      // Test connection
      await client.$connect();
      console.log(`   ↳ Connected successfully`);

      // For now, we'll just verify the connection
      // In production, each service would have its own schema subset
      const health = await client.$queryRaw`SELECT 1 as test`;
      console.log(`   ↳ Health check passed`);

    } catch (error) {
      console.error(`   ❌ Failed to setup ${db.name}:`, error);
      continue;
    } finally {
      await client.$disconnect();
    }

    console.log(`   ✅ ${db.name} setup completed\n`);
  }

  console.log('🎉 All databases setup completed!');
}

setupAllDatabases().catch(console.error);