import { PrismaClient } from './generated/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default roles and permissions
  console.log('📝 Creating permissions and roles...');

  const permissions = [
    // User management
    { name: 'users:read', resource: 'USER', action: 'READ', description: 'Read users' },
    { name: 'users:create', resource: 'USER', action: 'CREATE', description: 'Create users' },
    { name: 'users:update', resource: 'USER', action: 'UPDATE', description: 'Update users' },
    { name: 'users:delete', resource: 'USER', action: 'DELETE', description: 'Delete users' },

    // Tenant management
    { name: 'tenants:read', resource: 'TENANT', action: 'READ', description: 'Read tenants' },
    { name: 'tenants:create', resource: 'TENANT', action: 'CREATE', description: 'Create tenants' },
    { name: 'tenants:update', resource: 'TENANT', action: 'UPDATE', description: 'Update tenants' },
    { name: 'tenants:delete', resource: 'TENANT', action: 'DELETE', description: 'Delete tenants' },

    // Subscription management
    { name: 'subscriptions:read', resource: 'SUBSCRIPTION', action: 'READ', description: 'Read subscriptions' },
    { name: 'subscriptions:create', resource: 'SUBSCRIPTION', action: 'CREATE', description: 'Create subscriptions' },
    { name: 'subscriptions:update', resource: 'SUBSCRIPTION', action: 'UPDATE', description: 'Update subscriptions' },
    { name: 'subscriptions:cancel', resource: 'SUBSCRIPTION', action: 'CANCEL', description: 'Cancel subscriptions' },

    // Invoice management
    { name: 'invoices:read', resource: 'INVOICE', action: 'READ', description: 'Read invoices' },
    { name: 'invoices:create', resource: 'INVOICE', action: 'CREATE', description: 'Create invoices' },
    { name: 'invoices:update', resource: 'INVOICE', action: 'UPDATE', description: 'Update invoices' },

    // Notification management
    { name: 'notifications:read', resource: 'NOTIFICATION', action: 'READ', description: 'Read notifications' },
    { name: 'notifications:send', resource: 'NOTIFICATION', action: 'SEND', description: 'Send notifications' },

    // Report management
    { name: 'reports:read', resource: 'REPORT', action: 'READ', description: 'Read reports' },
    { name: 'reports:create', resource: 'REPORT', action: 'CREATE', description: 'Create reports' },
    { name: 'reports:execute', resource: 'REPORT', action: 'EXECUTE', description: 'Execute reports' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create system roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
    },
  });

  const tenantAdminRole = await prisma.role.upsert({
    where: { name: 'Tenant Admin' },
    update: {},
    create: {
      name: 'Tenant Admin',
      description: 'Tenant administration access',
      isSystem: true,
    },
  });

  const tenantUserRole = await prisma.role.upsert({
    where: { name: 'Tenant User' },
    update: {},
    create: {
      name: 'Tenant User',
      description: 'Basic tenant user access',
      isSystem: true,
    },
  });

  // Assign permissions to roles
  const allPermissions = await prisma.permission.findMany();

  // Super Admin gets all permissions
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Tenant Admin gets tenant-specific permissions
  const tenantAdminPermissions = allPermissions.filter(p =>
    p.resource !== 'TENANT' || p.action === 'READ' || p.action === 'UPDATE'
  );

  for (const permission of tenantAdminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: tenantAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: tenantAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Tenant User gets read-only permissions
  const tenantUserPermissions = allPermissions.filter(p => p.action === 'READ');

  for (const permission of tenantUserPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: tenantUserRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: tenantUserRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Create super admin user
  console.log('👑 Creating super admin user...');
  const superAdminPassword = await bcrypt.hash('admin123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@medsas.com' },
    update: {},
    create: {
      email: 'admin@medsas.com',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      preferences: {
        language: 'tr',
        timezone: 'Europe/Istanbul',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      profile: {
        department: 'System Administration',
        position: 'System Administrator',
      },
    },
  });

  // Create demo tenant
  console.log('🏢 Creating demo tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      domain: 'demo.medsas.local',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      settings: {
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
        },
        features: {
          analytics: true,
          api: true,
          webhooks: true,
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
          },
          sessionTimeout: 3600,
          mfaRequired: false,
        },
      },
      limits: {
        users: 100,
        storage: 10240, // 10GB in MB
        apiCalls: 100000,
        features: ['analytics', 'api', 'webhooks', 'reports'],
      },
    },
  });

  // Create tenant admin user
  console.log('👨‍💼 Creating tenant admin user...');
  const tenantAdminPassword = await bcrypt.hash('admin123', 12);

  const tenantAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo.medsas.local' },
    update: {},
    create: {
      email: 'admin@demo.medsas.local',
      passwordHash: tenantAdminPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      tenantId: demoTenant.id,
      preferences: {
        language: 'tr',
        timezone: 'Europe/Istanbul',
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      profile: {
        department: 'Administration',
        position: 'Tenant Administrator',
      },
    },
  });

  // Create demo users
  console.log('👥 Creating demo users...');
  const demoUsers = [
    { firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@demo.medsas.local' },
    { firstName: 'Fatma', lastName: 'Kaya', email: 'fatma@demo.medsas.local' },
    { firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet@demo.medsas.local' },
  ];

  for (const userData of demoUsers) {
    const password = await bcrypt.hash('user123', 12);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: password,
        role: 'TENANT_USER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        tenantId: demoTenant.id,
        preferences: {
          language: 'tr',
          timezone: 'Europe/Istanbul',
          theme: 'light',
          notifications: {
            email: true,
            push: false,
            sms: false,
          },
        },
        profile: {
          department: 'Operations',
          position: 'User',
        },
      },
    });
  }

  // Create demo subscription
  console.log('💳 Creating demo subscription...');
  const currentDate = new Date();
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(currentDate.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { subscriptionId: 'sub_demo_' + demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      customerId: 'cus_demo_' + demoTenant.id,
      subscriptionId: 'sub_demo_' + demoTenant.id,
      currentPeriodStart: currentDate,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
    },
  });

  // Create notification templates
  console.log('📧 Creating notification templates...');
  const templates = [
    {
      name: 'welcome_email',
      type: 'EMAIL' as const,
      subject: 'Hoş geldiniz - {{company_name}}',
      content: `Merhaba {{first_name}},

{{company_name}} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.

Giriş bilgileriniz:
Email: {{email}}

Hesabınıza erişmek için: {{login_url}}

Herhangi bir sorunuz varsa bizimle iletişime geçmekten çekinmeyin.

Saygılarımızla,
{{company_name}} Ekibi`,
      variables: ['first_name', 'company_name', 'email', 'login_url'],
    },
    {
      name: 'password_reset',
      type: 'EMAIL' as const,
      subject: 'Şifre Sıfırlama - {{company_name}}',
      content: `Merhaba {{first_name}},

Şifrenizi sıfırlamak için bir istek aldık. Aşağıdaki bağlantıya tıklayarak yeni bir şifre oluşturabilirsiniz:

{{reset_url}}

Bu bağlantı 1 saat sonra geçersiz olacaktır.

Eğer bu isteği siz yapmadıysanız, bu mesajı görmezden gelebilirsiniz.

Saygılarımızla,
{{company_name}} Ekibi`,
      variables: ['first_name', 'company_name', 'reset_url'],
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }

  // Create system configurations
  console.log('⚙️ Creating system configurations...');
  const configs = [
    { key: 'app_name', value: 'MedSAS', isPublic: true },
    { key: 'app_version', value: '1.0.0', isPublic: true },
    { key: 'maintenance_mode', value: false, isPublic: true },
    { key: 'registration_enabled', value: true, isPublic: true },
    { key: 'max_file_size', value: 10485760, isPublic: false }, // 10MB
    { key: 'allowed_file_types', value: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'], isPublic: false },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log('✅ Database seeding completed!');
  console.log('\n📋 Created accounts:');
  console.log('   Super Admin: admin@medsas.com (password: admin123)');
  console.log('   Tenant Admin: admin@demo.medsas.local (password: admin123)');
  console.log('   Demo Users: ahmet@demo.medsas.local, fatma@demo.medsas.local, mehmet@demo.medsas.local (password: user123)');
  console.log('\n🏢 Demo tenant: demo-company (demo.medsas.local)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });