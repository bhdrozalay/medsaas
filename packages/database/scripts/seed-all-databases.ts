import { PrismaClient } from '../src/generated/client';
import bcrypt from 'bcryptjs';

async function seedAllDatabases() {
  console.log('🌱 Seeding all databases...\n');

  const databases = [
    { name: 'Identity', url: process.env.IDENTITY_DATABASE_URL! },
    { name: 'Tenant', url: process.env.TENANT_DATABASE_URL! },
    { name: 'Billing', url: process.env.BILLING_DATABASE_URL! },
    { name: 'Notification', url: process.env.NOTIFICATION_DATABASE_URL! },
    { name: 'Reporting', url: process.env.REPORTING_DATABASE_URL! },
  ];

  for (const db of databases) {
    console.log(`🌱 Seeding ${db.name} database...`);

    const client = new PrismaClient({
      datasources: {
        db: { url: db.url },
      },
    });

    try {
      await client.$connect();

      if (db.name === 'Identity') {
        await seedIdentityData(client);
      } else if (db.name === 'Tenant') {
        await seedTenantData(client);
      } else if (db.name === 'Billing') {
        await seedBillingData(client);
      } else if (db.name === 'Notification') {
        await seedNotificationData(client);
      } else if (db.name === 'Reporting') {
        await seedReportingData(client);
      }

      console.log(`   ✅ ${db.name} database seeded successfully\n`);
    } catch (error) {
      console.error(`   ❌ Failed to seed ${db.name} database:`, error);
    } finally {
      await client.$disconnect();
    }
  }

  console.log('🎉 All databases seeded successfully!');
}

async function seedIdentityData(client: PrismaClient) {
  // Create permissions
  const permissions = [
    { name: 'users:read', resource: 'USER', action: 'READ' },
    { name: 'users:create', resource: 'USER', action: 'CREATE' },
    { name: 'users:update', resource: 'USER', action: 'UPDATE' },
    { name: 'users:delete', resource: 'USER', action: 'DELETE' },
  ];

  for (const permission of permissions) {
    await client.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create roles
  const superAdminRole = await client.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin', description: 'Full access', isSystem: true },
  });

  // Create super admin user
  const password = await bcrypt.hash('admin123', 12);
  await client.user.upsert({
    where: { email: 'admin@medsas.com' },
    update: {},
    create: {
      email: 'admin@medsas.com',
      passwordHash: password,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
}

async function seedTenantData(client: PrismaClient) {
  // Create demo tenant
  await client.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      domain: 'demo.medsas.local',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      settings: {
        branding: { primaryColor: '#3B82F6' },
        features: { analytics: true },
      },
      limits: {
        users: 100,
        storage: 10240,
        apiCalls: 100000,
      },
    },
  });
}

async function seedBillingData(client: PrismaClient) {
  // Find tenant first
  const tenant = await client.tenant.findUnique({
    where: { slug: 'demo-company' },
  });

  if (tenant) {
    const currentDate = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + 1);

    await client.subscription.upsert({
      where: { subscriptionId: 'sub_demo_' + tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: currentDate,
        currentPeriodEnd: nextMonth,
        subscriptionId: 'sub_demo_' + tenant.id,
      },
    });
  }
}

async function seedNotificationData(client: PrismaClient) {
  const templates = [
    {
      name: 'welcome_email',
      type: 'EMAIL' as const,
      subject: 'Hoş geldiniz',
      content: 'Merhaba {{first_name}}, hoş geldiniz!',
      variables: ['first_name'],
    },
    {
      name: 'password_reset',
      type: 'EMAIL' as const,
      subject: 'Şifre Sıfırlama',
      content: 'Şifre sıfırlama linki: {{reset_url}}',
      variables: ['reset_url'],
    },
  ];

  for (const template of templates) {
    await client.notificationTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
}

async function seedReportingData(client: PrismaClient) {
  // Create sample system configs
  const configs = [
    { key: 'app_name', value: 'MedSAS', isPublic: true },
    { key: 'app_version', value: '1.0.0', isPublic: true },
  ];

  for (const config of configs) {
    await client.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
}

// Load environment variables
require('dotenv').config();

seedAllDatabases().catch(console.error);