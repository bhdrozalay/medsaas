import { identityDb, tenantDb, checkDatabaseHealth } from './client';
import { healthCheck } from './migrations';

async function testDatabase() {
  console.log('🧪 Testing database connections...\n');

  try {
    // Test Identity DB
    console.log('1. Testing Identity Database...');
    const identityClient = identityDb();
    const identityHealth = await healthCheck(identityClient);
    console.log(`   Status: ${identityHealth.status}`);
    console.log(`   Latency: ${identityHealth.latency}ms`);

    // Test data retrieval
    const users = await identityClient.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
    console.log(`   Users found: ${users.length}`);
    console.log(`   Sample user: ${users[0]?.firstName} ${users[0]?.lastName} (${users[0]?.email})`);

    // Test Tenant DB
    console.log('\n2. Testing Tenant Database...');
    const tenantClient = tenantDb();
    const tenantHealth = await healthCheck(tenantClient);
    console.log(`   Status: ${tenantHealth.status}`);
    console.log(`   Latency: ${tenantHealth.latency}ms`);

    const tenants = await tenantClient.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        plan: true,
        _count: {
          select: {
            users: true,
            subscriptions: true,
          },
        },
      },
    });
    console.log(`   Tenants found: ${tenants.length}`);
    if (tenants[0]) {
      console.log(`   Sample tenant: ${tenants[0].name} (${tenants[0].slug})`);
      console.log(`   Users: ${tenants[0]._count.users}, Subscriptions: ${tenants[0]._count.subscriptions}`);
    }

    // Test complex query with relations
    console.log('\n3. Testing complex queries...');
    const userWithTenant = await identityClient.user.findFirst({
      where: {
        role: 'TENANT_ADMIN',
      },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    if (userWithTenant) {
      console.log(`   Tenant Admin: ${userWithTenant.firstName} ${userWithTenant.lastName}`);
      console.log(`   Tenant: ${userWithTenant.tenant?.name} (${userWithTenant.tenant?.plan})`);
    }

    console.log('\n✅ All database tests passed!');
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();