import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const approveUserSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional()
});

// Helper function to verify Super Admin
async function verifySuperAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  // For testing purposes, extract user email from token
  const token = authHeader.substring(7);
  const email = token; // In production, you'd verify the JWT token properly
  
  // Look up user in database
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

// GET - List all pending approval users
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
    const status = searchParams.get('status') || 'PENDING_APPROVAL';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      role: 'TENANT_ADMIN' // Only show tenant admins that need approval
    };

    if (status === 'PENDING_APPROVAL') {
      whereClause.status = UserStatus.PENDING_APPROVAL;
    } else if (status === 'APPROVED') {
      whereClause.status = UserStatus.ACTIVE;
      whereClause.approvedAt = { not: null };
    } else if (status === 'REJECTED') {
      whereClause.status = UserStatus.REJECTED;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          approvedAt: true,
          approvedBy: true,
          rejectedAt: true,
          rejectedBy: true,
          rejectionReason: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              plan: true
            }
          },
          profile: true,
          approvedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          rejectedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Parse profile data
    const formattedUsers = users.map(user => {
      let profileData = {};
      try {
        profileData = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile || {};
      } catch (e) {
        profileData = {};
      }

      return {
        ...user,
        organizationName: user.tenant?.name || (profileData as any).organizationName,
        profile: undefined // Remove raw profile from response
      };
    });

    // Get summary statistics
    const stats = await prisma.user.aggregate({
      where: { role: 'TENANT_ADMIN' },
      _count: {
        id: true
      }
    });

    const pendingCount = await prisma.user.count({
      where: { 
        role: 'TENANT_ADMIN',
        status: UserStatus.PENDING_APPROVAL 
      }
    });

    const approvedCount = await prisma.user.count({
      where: { 
        role: 'TENANT_ADMIN',
        status: UserStatus.ACTIVE,
        approvedAt: { not: null }
      }
    });

    const rejectedCount = await prisma.user.count({
      where: { 
        role: 'TENANT_ADMIN',
        status: UserStatus.REJECTED 
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalUsers: totalCount,
          hasNext: skip + limit < totalCount,
          hasPrev: page > 1
        },
        stats: {
          total: stats._count.id,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        }
      }
    });

  } catch (error) {
    console.error('Super Admin - List users error:', error);

    return NextResponse.json({
      error: 'Kullanıcılar listelenirken bir hata oluştu.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}

// POST - Approve or reject a user
export async function POST(request: NextRequest) {
  try {
    // Verify super admin authorization
    const authResult = await verifySuperAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json({
        error: authResult.error,
        code: 'UNAUTHORIZED'
      }, { status: authResult.status });
    }

    const { userId: adminUserId } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = approveUserSchema.parse(body);

    // Find the user to approve/reject
    const userToProcess = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!userToProcess) {
      return NextResponse.json({
        error: 'Kullanıcı bulunamadı.',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    if (userToProcess.status !== UserStatus.PENDING_APPROVAL) {
      return NextResponse.json({
        error: 'Bu kullanıcı zaten işlem görmüş.',
        code: 'ALREADY_PROCESSED'
      }, { status: 400 });
    }

    if (userToProcess.role !== 'TENANT_ADMIN') {
      return NextResponse.json({
        error: 'Sadece Tenant Admin kullanıcıları onaylanabilir.',
        code: 'INVALID_USER_TYPE'
      }, { status: 400 });
    }

    let updateData: any;
    let message: string;

    if (validatedData.action === 'approve') {
      // Approve user
      updateData = {
        status: UserStatus.ACTIVE,
        approvedAt: new Date(),
        approvedBy: adminUserId,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null
      };
      message = `${userToProcess.firstName} ${userToProcess.lastName} başarıyla onaylandı.`;

      // Also activate the tenant if it's not active
      if (userToProcess.tenant && userToProcess.tenant.id) {
        await prisma.tenant.update({
          where: { id: userToProcess.tenant.id },
          data: {
            status: 'ACTIVE'
          }
        });
      }

    } else {
      // Reject user
      updateData = {
        status: UserStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason: validatedData.reason || 'Sebep belirtilmedi',
        approvedAt: null,
        approvedBy: null
      };
      message = `${userToProcess.firstName} ${userToProcess.lastName} reddedildi.`;

      // Mark tenant as cancelled if rejected
      if (userToProcess.tenant && userToProcess.tenant.id) {
        await prisma.tenant.update({
          where: { id: userToProcess.tenant.id },
          data: {
            status: 'CANCELLED'
          }
        });
      }
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        },
        approvedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`Super Admin ${adminUserId} ${validatedData.action}d user ${updatedUser.email} (${updatedUser.tenant?.name})`);

    return NextResponse.json({
      success: true,
      message,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          status: updatedUser.status,
          organizationName: updatedUser.tenant?.name,
          approvedAt: updatedUser.approvedAt,
          rejectedAt: updatedUser.rejectedAt,
          rejectionReason: updatedUser.rejectionReason
        }
      }
    });

  } catch (error) {
    console.error('Super Admin - Approve/Reject user error:', error);

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
      error: 'İşlem gerçekleştirilirken bir hata oluştu.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}