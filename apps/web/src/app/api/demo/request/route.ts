import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../prisma/generated/client';
import { TurkishPhoneUtil } from '@medsas/utils/phone';
import { z } from 'zod';
// Rate limiting removed for App Router - will implement differently

const prisma = new PrismaClient();

// Rate limiting will be implemented with middleware in App Router

/*
// Validation schema
const demoRequestSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(50),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').max(50),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().refine(
    (phone) => TurkishPhoneUtil.isValidPhoneNumber(phone),
    'Geçerli bir Türk telefon numarası giriniz'
  ),
  organizationName: z.string().min(2, 'Kurum adı en az 2 karakter olmalıdır').max(100),
  organizationType: z.string().optional(),
  jobTitle: z.string().optional(),
  city: z.string().min(2, 'Şehir seçiniz'),
  district: z.string().optional(),
  requestedFeatures: z.array(z.string()).optional().default([]),
  source: z.string().default('website'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  language: z.string().default('tr'),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
});
*/

export async function POST(request: Request) {
  // Temporarily disabled until demo request schema is added
  return NextResponse.json({
    error: 'Demo requests are temporarily disabled',
    code: 'SERVICE_UNAVAILABLE'
  }, { status: 503 });

  /*
  // Method is already handled by function name (POST)

  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validatedData = demoRequestSchema.parse(body);

    // Get client IP address
    const clientIp = 
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check if email already exists
    const existingRequest = await prisma.demoRequest.findFirst({
      where: {
        email: validatedData.email,
        status: {
          in: [DemoRequestStatus.PENDING, DemoRequestStatus.CONTACTED, DemoRequestStatus.SCHEDULED]
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json({
        error: 'Bu e-posta adresi ile daha önce aktif bir demo talebi bulunmaktadır.',
        code: 'EMAIL_ALREADY_EXISTS',
        existingRequestId: existingRequest.id
      }, { status: 409 });
    }

    // Format phone number
    const formattedPhone = TurkishPhoneUtil.formatPhoneNumber(validatedData.phone);
    const phoneOperator = TurkishPhoneUtil.getOperator(validatedData.phone);

    // Create demo request
    const demoRequest = await prisma.demoRequest.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: formattedPhone,
        organizationName: validatedData.organizationName,
        organizationType: validatedData.organizationType,
        jobTitle: validatedData.jobTitle,
        city: validatedData.city,
        district: validatedData.district,
        requestedFeatures: validatedData.requestedFeatures,
        source: validatedData.source,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || 'unknown',
        language: validatedData.language,
        utmSource: validatedData.utmSource,
        utmMedium: validatedData.utmMedium,
        utmCampaign: validatedData.utmCampaign,
        status: DemoRequestStatus.PENDING,
        metadata: {
          submittedAt: new Date().toISOString(),
          browserInfo: {
            userAgent: request.headers.get('user-agent'),
            acceptLanguage: request.headers.get('accept-language'),
            acceptEncoding: request.headers.get('accept-encoding'),
          }
        }
      }
    });

    // Log the demo request for analytics
    console.log(`New demo request created: ${demoRequest.id} from ${validatedData.email}`);

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to user
    // TODO: Add to CRM system
    // TODO: Trigger Slack/Teams notification

    // Create initial communication record
    // Note: We'll skip this for now since we need a system user ID
    // await prisma.demoCommunication.create({...});

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Demo talebiniz başarıyla alınmıştır!',
      data: {
        id: demoRequest.id,
        email: demoRequest.email,
        organizationName: demoRequest.organizationName,
        status: demoRequest.status,
        createdAt: demoRequest.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Demo request error:', error);

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

    // Handle rate limit errors
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return NextResponse.json({
        error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyiniz.',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 });
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'P2002':
          return NextResponse.json({
            error: 'Bu e-posta adresi ile daha önce demo talebinde bulunulmuş.',
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
      error: 'Demo talebi işlenirken bir hata oluştu. Lütfen tekrar deneyiniz.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
  */
}
