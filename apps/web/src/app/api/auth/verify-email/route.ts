import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserStatus } from '@medsas/database';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Validation schema
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Doğrulama kodu gereklidir'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({
        error: 'Doğrulama kodu bulunamadı',
        code: 'MISSING_TOKEN'
      }, { status: 400 });
    }

    return verifyEmailToken(token);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({
      error: 'E-posta doğrulaması yapılırken bir hata oluştu',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = verifyEmailSchema.parse(body);
    
    return verifyEmailToken(token);
  } catch (error) {
    console.error('Email verification error:', error);
    
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
      error: 'E-posta doğrulaması yapılırken bir hata oluştu',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}

async function verifyEmailToken(token: string): Promise<NextResponse> {
  // Find verification token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!verificationToken) {
    return NextResponse.json({
      error: 'Geçersiz veya bulunamayan doğrulama kodu',
      code: 'INVALID_TOKEN'
    }, { status: 400 });
  }

  // Check if token is expired
  if (verificationToken.expiresAt < new Date()) {
    return NextResponse.json({
      error: 'Doğrulama kodu süresi dolmuş',
      code: 'TOKEN_EXPIRED'
    }, { status: 400 });
  }

  // Check if token is already used
  if (verificationToken.usedAt) {
    return NextResponse.json({
      error: 'Bu doğrulama kodu daha önce kullanılmış',
      code: 'TOKEN_ALREADY_USED'
    }, { status: 400 });
  }

  // Check if it's email verification token
  if (verificationToken.type !== 'EMAIL_VERIFICATION') {
    return NextResponse.json({
      error: 'Geçersiz doğrulama tipi',
      code: 'INVALID_TOKEN_TYPE'
    }, { status: 400 });
  }

  // Update user and token in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update verification token as used
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: {
          usedAt: new Date(),
        }
      });

      // Update user email verification status
      const updatedUser = await tx.user.update({
        where: { id: verificationToken.userId },
        data: {
          status: UserStatus.ACTIVE, // Activate user after email verification
        }
      });

      return updatedUser;
    });

    console.log(`Email verified for user: ${result.email}`);

    // Send welcome email after successful verification (async, don't wait)
    sendWelcomeEmailAfterVerification(result).catch(error => 
      console.error('Failed to send welcome email after verification:', error)
    );

    return NextResponse.json({
      success: true,
      message: 'E-posta adresiniz başarıyla doğrulandı!',
      data: {
        user: {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          status: result.status
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Email verification transaction error:', error);
    return NextResponse.json({
      error: 'E-posta doğrulaması yapılırken bir hata oluştu',
      code: 'VERIFICATION_FAILED'
    }, { status: 500 });
  }
}

// Helper functions
function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}

async function sendWelcomeEmailAfterVerification(user: any): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.log('SMTP not configured, skipping welcome email');
    return;
  }

  try {
    // Get user's tenant and subscription information
    const userWithDetails = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tenant: {
          include: {
            subscriptions: {
              where: { status: 'TRIALING' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!userWithDetails || !userWithDetails.tenant) {
      console.error('User or tenant not found for welcome email');
      return;
    }

    const tenant = userWithDetails.tenant;
    const subscription = tenant.subscriptions[0];

    if (!subscription) {
      console.error('No active subscription found for welcome email');
      return;
    }

    const transporter = createEmailTransporter();
    const trialEndDate = subscription.trialEnd?.toLocaleDateString('tr-TR') || 'Belirsiz';
    const dashboardUrl = `${process.env.APP_URL || 'https://app.medsas.com'}/${tenant.slug}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hoş Geldiniz - MedSAS</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #16a085 0%, #2980b9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🏥 MedSAS</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Sağlık Yönetim Sistemi</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 28px; font-weight: bold;">🎉 Hoş Geldiniz!</h2>
                <p style="color: #34495e; margin: 0; font-size: 18px;">
                  Sayın <strong>${user.firstName} ${user.lastName}</strong>
                </p>
                <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">
                  ${tenant.name}
                </p>
              </div>
              
              <div style="background: linear-gradient(135deg, #e8f8f5, #d5f4e6); border-left: 4px solid #16a085; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #16a085; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">✅ E-posta Adresiniz Doğrulandı!</h3>
                <p style="color: #2c3e50; margin: 0; font-size: 16px; line-height: 1.6;">
                  Artık sisteme giriş yapabilirsiniz. 15 günlük deneme süreniz <strong>${trialEndDate}</strong> tarihine kadar geçerlidir.
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${dashboardUrl}" 
                   style="display: inline-block; padding: 15px 35px; margin: 10px; background: linear-gradient(135deg, #16a085, #2980b9); color: #ffffff; text-decoration: none; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);">
                  🚀 Sisteme Giriş Yap
                </a>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 30px 0;">
                <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px; text-align: center;">📋 Sonraki Adımlar</h3>
                <ul style="color: #5a6c7d; margin: 0; padding: 0; list-style: none;">
                  <li style="margin: 10px 0; display: flex; align-items: center;">
                    <span style="color: #16a085; margin-right: 10px; font-weight: bold;">1.</span>
                    Sisteme giriş yapın ve profilinizi tamamlayın
                  </li>
                  <li style="margin: 10px 0; display: flex; align-items: center;">
                    <span style="color: #16a085; margin-right: 10px; font-weight: bold;">2.</span>
                    İlk kullanıcınızı ekleyin (toplam 2 kullanıcı hakkınız var)
                  </li>
                  <li style="margin: 10px 0; display: flex; align-items: center;">
                    <span style="color: #16a085; margin-right: 10px; font-weight: bold;">3.</span>
                    Demo verilerle sistemi keşfedin
                  </li>
                  <li style="margin: 10px 0; display: flex; align-items: center;">
                    <span style="color: #16a085; margin-right: 10px; font-weight: bold;">4.</span>
                    Sorularınız için destek ekibimizle iletişime geçin
                  </li>
                </ul>
              </div>
              
              <div style="background: linear-gradient(135deg, #d5f4e6, #a8e6cf); border-left: 4px solid #27ae60; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">🎁 Deneme Süresi Özellikleriniz</h3>
                <ul style="color: #2c3e50; margin: 0; padding-left: 20px;">
                  <li>2 kullanıcı (1 admin + 1 ek kullanıcı)</li>
                  <li>1GB depolama alanı</li>
                  <li>1000 API çağrısı/ay</li>
                  <li>Tüm temel özellikler</li>
                  <li>E-posta desteği</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2c3e50; padding: 30px 40px; text-align: center;">
              <p style="color: #bdc3c7; margin: 0 0 15px 0; font-size: 16px;">
                Sorularınız mı var? Yardıma ihtiyacınız mı var?
              </p>
              <p style="color: #ecf0f1; margin: 0 0 20px 0; font-size: 14px;">
                📧 <strong>destek@medsas.com</strong> | 📞 <strong>0850 XXX XX XX</strong>
              </p>
              <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                © 2024 MedSAS - Sağlık Yönetim Sistemi. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"MedSAS" <${process.env.SMTP_FROM || 'noreply@medsas.com'}>`,
      to: user.email,
      subject: `🎉 Hoş Geldiniz ${user.firstName}! MedSAS Hesabınız Hazır`,
      html
    });

    console.log(`Welcome email sent to ${user.email} after email verification`);
  } catch (error) {
    console.error('Failed to send welcome email after verification:', error);
    throw error;
  }
}
