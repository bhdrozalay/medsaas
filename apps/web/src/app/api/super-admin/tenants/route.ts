import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TenantStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const updateTenantSchema = z.object({
  tenantId: z.string().cuid(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  plan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  limits: z.object({
    users: z.number().optional(),
    storage: z.number().optional(),
    apiCalls: z.number().optional(),
    features: z.array(z.string()).optional()
  }).optional()
});

// Helper function to verify Super Admin
async function verifySuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const token = authHeader.substring(7);
  const email = token;
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      status: true
    }
  });
  
  if (!user) {
    return { error: 'User not found', status: 401 };
  }
  
  if (user.role !== 'SUPER_ADMIN') {
    return { error: 'Insufficient privileges - Super Admin required', status: 403 };
  }

  if (user.status !== 'ACTIVE') {
    return { error: 'Account not active', status: 403 };
  }
  
  return {
    userId: user.id,
    role: user.role
  };
}

// GET - List all tenants with their stats
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authorization
    const authResult = await verifySuperAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json({
        error: authResult.error,
        code: 'UNAUTHORIZED'
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const plan = searchParams.get('plan') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status as TenantStatus;
    }

    if (plan && plan !== 'ALL') {
      whereClause.plan = plan;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get tenants with their user counts
    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
              lastLoginAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.tenant.count({ where: whereClause })
    ]);

    // Format the response
    const formattedTenants = tenants.map(tenant => {
      // Parse settings and limits
      let settings = {};
      let limits = {};
      try {
        settings = typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings || {};
        limits = typeof tenant.limits === 'string' ? JSON.parse(tenant.limits) : tenant.limits || {};
      } catch (e) {
        settings = {};
        limits = {};
      }

      // Calculate usage stats
      const activeUsers = tenant.users.filter(u => u.status === 'ACTIVE').length;
      const adminUsers = tenant.users.filter(u => u.role === 'TENANT_ADMIN').length;
      const regularUsers = tenant.users.filter(u => u.role === 'TENANT_USER').length;
      const lastActivity = tenant.users.reduce((latest, user) => {
        if (user.lastLoginAt && (!latest || user.lastLoginAt > latest)) {
          return user.lastLoginAt;
        }
        return latest;
      }, null as Date | null);

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        status: tenant.status,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        settings,
        limits,
        stats: {
          totalUsers: tenant._count.users,
          activeUsers,
          adminUsers,
          regularUsers,
          lastActivity
        },
        users: tenant.users
      };
    });

    // Get overall stats
    const overallStats = await prisma.tenant.aggregate({
      _count: {
        id: true
      }
    });

    const statusStats = await Promise.all([
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'TRIAL' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.tenant.count({ where: { status: 'CANCELLED' } })
    ]);

    const planStats = await Promise.all([
      prisma.tenant.count({ where: { plan: 'FREE' } }),
      prisma.tenant.count({ where: { plan: 'BASIC' } }),
      prisma.tenant.count({ where: { plan: 'PROFESSIONAL' } }),
      prisma.tenant.count({ where: { plan: 'ENTERPRISE' } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tenants: formattedTenants,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalTenants: totalCount,
          hasNext: skip + limit < totalCount,
          hasPrev: page > 1
        },
        stats: {
          total: overallStats._count.id,
          byStatus: {
            active: statusStats[0],
            trial: statusStats[1],
            suspended: statusStats[2],
            cancelled: statusStats[3]
          },
          byPlan: {
            free: planStats[0],
            basic: planStats[1],
            professional: planStats[2],
            enterprise: planStats[3]
          }
        }
      }
    });

  } catch (error) {
    console.error('Super Admin - List tenants error:', error);

    return NextResponse.json({
      error: 'Tenant\'lar listelenirken bir hata oluştu.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update tenant status, plan, or limits
export async function PUT(request: NextRequest) {
  try {
    // Verify super admin authorization
    const authResult = await verifySuperAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json({
        error: authResult.error,
        code: 'UNAUTHORIZED'
      }, { status: authResult.status });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTenantSchema.parse(body);

    // Find the tenant
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!existingTenant) {
      return NextResponse.json({
        error: 'Tenant bulunamadı.',
        code: 'TENANT_NOT_FOUND'
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.plan) {
      updateData.plan = validatedData.plan;
    }

    if (validatedData.limits) {
      // Merge with existing limits
      let currentLimits = {};
      try {
        currentLimits = typeof existingTenant.limits === 'string' 
          ? JSON.parse(existingTenant.limits) 
          : existingTenant.limits || {};
      } catch (e) {
        currentLimits = {};
      }

      const newLimits = {
        ...currentLimits,
        ...validatedData.limits
      };
      updateData.limits = JSON.stringify(newLimits);
    }

    // Update the tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: validatedData.tenantId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    // If tenant is being suspended or cancelled, update user statuses
    if (validatedData.status === 'SUSPENDED') {
      await prisma.user.updateMany({
        where: { 
          tenantId: validatedData.tenantId,
          status: 'ACTIVE'
        },
        data: {
          status: 'SUSPENDED'
        }
      });
    } else if (validatedData.status === 'CANCELLED') {
      await prisma.user.updateMany({
        where: { 
          tenantId: validatedData.tenantId,
          status: { in: ['ACTIVE', 'SUSPENDED'] }
        },
        data: {
          status: 'INACTIVE'
        }
      });
    } else if (validatedData.status === 'ACTIVE') {
      // Reactivate approved users when tenant is reactivated
      await prisma.user.updateMany({
        where: { 
          tenantId: validatedData.tenantId,
          approvedAt: { not: null },
          status: { in: ['SUSPENDED', 'INACTIVE'] }
        },
        data: {
          status: 'ACTIVE'
        }
      });
    }

    console.log(`Super Admin updated tenant ${updatedTenant.name} (${updatedTenant.id})`);

    return NextResponse.json({
      success: true,
      message: `${updatedTenant.name} tenant'ı başarıyla güncellendi.`,
      data: {
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          slug: updatedTenant.slug,
          status: updatedTenant.status,
          plan: updatedTenant.plan,
          userCount: updatedTenant._count.users,
          updatedAt: updatedTenant.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Super Admin - Update tenant error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Geçersiz veri gönderildi',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Tenant güncellenirken bir hata oluştu.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}