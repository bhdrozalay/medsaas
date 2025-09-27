import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@medsas/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(50),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').max(50),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır').max(15).optional(),
  organizationName: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır').max(100),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir sayı içermelidir')
    .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermelidir'),
});

// Helper function to create URL-safe slug from organization name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function getUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.tenant.findUnique({
      where: { slug }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: Request) {
  try {
    console.log('=== REGISTER API CALLED ===');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate request body
    console.log('Validating request data...');
    const validatedData = registerSchema.parse(body);
    console.log('Validation successful:', validatedData.email);

    // Check if user already exists
    console.log('Checking if user exists:', validatedData.email);
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    console.log('Existing user check result:', existingUser ? 'User exists' : 'User does not exist');

    if (existingUser) {
      return NextResponse.json({
        error: 'Bu e-posta adresi zaten kullanımda.',
        code: 'EMAIL_ALREADY_EXISTS'
      }, { status: 409 });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

    // Get client IP address
    const clientIp = 
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Create unique slug for the organization
    const baseSlug = createSlug(validatedData.organizationName);
    const uniqueSlug = await getUniqueSlug(baseSlug);
    
    // Every registered user becomes a TENANT_ADMIN with their own tenant
    console.log('Creating tenant with slug:', uniqueSlug);
    const newTenant = await prisma.tenant.create({
      data: {
        name: validatedData.organizationName,
        slug: uniqueSlug,
        status: 'TRIAL',
        plan: 'FREE',
        settings: JSON.stringify({
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          },
          features: {
            'user-management': true,
            'basic-reporting': true,
            'api-access': false
          },
          security: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSymbols: true
            },
            sessionTimeout: 3600,
            mfaRequired: false
          }
        }),
        limits: JSON.stringify({
          users: 10,
          storage: 5, // GB
          apiCalls: 1000,
          features: ['basic-reporting', 'user-management']
        })
      }
    });
    
    const tenantId = newTenant.id;
    const userRole = 'TENANT_ADMIN'; // All registered users become TENANT_ADMIN
    
    console.log(`New tenant created: ${newTenant.id} (${newTenant.name}) with admin user: ${validatedData.email}`);

    // Calculate trial dates (30 days trial)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 günlük deneme
    
    // Create user with determined role and tenant (as demo user)
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role: userRole,
        status: 'PENDING_APPROVAL', // Demo kullanıcı olarak PENDING_APPROVAL
        tenantId,
        trialStartDate,
        trialEndDate
      },
      include: {
        tenant: true
      }
    });

    // Log successful registration
    console.log(`New user registered: ${user.id} (${user.email}) as ${user.role} for tenant: ${user.tenant?.name}`);

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Demo hesabınız başarıyla oluşturuldu! 30 günlük ücretsiz deneme süreciniz başlamıştır. Demo talebinizi tamamlamak için lütfen gerekli bilgileri doldurunuz.',
        data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          tenantId: user.tenantId,
          organizationName: user.tenant?.name,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          isDemoUser: true
        },
        tenant: {
          id: user.tenant?.id,
          name: user.tenant?.name,
          slug: user.tenant?.slug,
          status: user.tenant?.status,
          plan: user.tenant?.plan
        },
        isTenantAdmin: true
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      error
    });

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
      error: 'Hesap oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}
