import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@medsas/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema for creating sub-users
const createSubUserSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(50),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').max(50),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır').max(15).optional(),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir sayı içermelidir')
    .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermelidir'),
  department: z.string().optional(),
  position: z.string().optional(),
});

// Helper function to extract JWT token and verify admin role
async function verifyTenantAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  // For testing purposes, extract user email from token
  const token = authHeader.substring(7);
  
  // In this demo, token is just the user email
  // In production, you'd verify the JWT token properly
  const email = token;
  
  // Look up user in database
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      tenantId: true
    }
  });
  
  if (!user) {
    return { error: 'User not found', status: 401 };
  }
  
  if (user.role !== 'TENANT_ADMIN') {
    return { error: 'Insufficient privileges', status: 403 };
  }
  
  return {
    userId: user.id,
    tenantId: user.tenantId!,
    role: user.role
  };
}

// POST - Create sub-user (only for TENANT_ADMIN)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyTenantAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json({
        error: authResult.error,
        code: 'UNAUTHORIZED'
      }, { status: authResult.status });
    }

    const { userId: adminUserId, tenantId, role } = authResult;

    if (role !== 'TENANT_ADMIN') {
      return NextResponse.json({
        error: 'Bu işlemi sadece tenant yöneticileri gerçekleştirebilir.',
        code: 'INSUFFICIENT_PRIVILEGES'
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validatedData = createSubUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({
        error: 'Bu e-posta adresi zaten kullanımda.',
        code: 'EMAIL_ALREADY_EXISTS'
      }, { status: 409 });
    }

    // Get admin's tenant info
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      include: { tenant: true }
    });

    if (!adminUser || !adminUser.tenant) {
      return NextResponse.json({
        error: 'Admin kullanıcı veya tenant bulunamadı.',
        code: 'ADMIN_NOT_FOUND'
      }, { status: 404 });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Get client IP address
    const clientIp = 
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Create sub-user with TENANT_USER role
    const subUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: 'TENANT_USER', // Sub-users are always TENANT_USER
        status: 'ACTIVE',
        tenantId: adminUser.tenantId,
        preferences: JSON.stringify({
          language: 'tr',
          timezone: 'Europe/Istanbul',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            marketing: false
          }
        }),
        profile: JSON.stringify({
          registrationIp: clientIp,
          registrationUserAgent: request.headers.get('user-agent') || 'unknown',
          department: validatedData.department || null,
          position: validatedData.position || null,
          createdBy: adminUserId
        })
      },
      include: {
        tenant: true
      }
    });

    // Log successful sub-user creation
    console.log(`Sub-user created: ${subUser.id} (${subUser.email}) by admin: ${adminUserId} for tenant: ${adminUser.tenant.name}`);

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Alt kullanıcı başarıyla oluşturuldu!',
      data: {
        user: {
          id: subUser.id,
          email: subUser.email,
          firstName: subUser.firstName,
          lastName: subUser.lastName,
          phone: subUser.phone,
          role: subUser.role,
          status: subUser.status,
          tenantId: subUser.tenantId,
          organizationName: subUser.tenant?.name,
          department: validatedData.department,
          position: validatedData.position,
          createdAt: subUser.createdAt
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Sub-user creation error:', error);

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

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'P2002':
          return NextResponse.json({
            error: 'Bu e-posta adresi zaten kullanımda.',
            code: 'UNIQUE_CONSTRAINT_VIOLATION'
          }, { status: 409 });
        case 'P2003':
          return NextResponse.json({
            error: 'Geçersiz veri ilişkisi.',
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION'
          }, { status: 400 });
        default:
          console.error('Prisma error:', error);
      }
    }

    // Generic error response
    return NextResponse.json({
      error: 'Alt kullanıcı oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  }
}

// GET - List tenant's sub-users (only for TENANT_ADMIN)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authResult = await verifyTenantAdmin(request);
    if ('error' in authResult) {
      return NextResponse.json({
        error: authResult.error,
        code: 'UNAUTHORIZED'
      }, { status: authResult.status });
    }

    const { userId: adminUserId, tenantId, role } = authResult;

    if (role !== 'TENANT_ADMIN') {
      return NextResponse.json({
        error: 'Bu işlemi sadece tenant yöneticileri gerçekleştirebilir.',
        code: 'INSUFFICIENT_PRIVILEGES'
      }, { status: 403 });
    }

    // Get admin's tenant info
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!adminUser || !adminUser.tenantId) {
      return NextResponse.json({
        error: 'Admin kullanıcı bulunamadı.',
        code: 'ADMIN_NOT_FOUND'
      }, { status: 404 });
    }

    // Get all users in the same tenant (excluding the admin)
    const tenantUsers = await prisma.user.findMany({
      where: {
        tenantId: adminUser.tenantId,
        id: { not: adminUserId }, // Exclude admin from list
        role: 'TENANT_USER' // Only show sub-users
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse profile data to extract department and position
    const formattedUsers = tenantUsers.map(user => {
      let profileData = {};
      try {
        profileData = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile || {};
      } catch (e) {
        profileData = {};
      }

      return {
        ...user,
        department: (profileData as any).department || null,
        position: (profileData as any).position || null,
        profile: undefined // Remove raw profile from response
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        totalUsers: formattedUsers.length
      }
    });

  } catch (error) {
    console.error('Get tenant users error:', error);

    return NextResponse.json({
      error: 'Kullanıcılar listelenirken bir hata oluştu.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  }
}