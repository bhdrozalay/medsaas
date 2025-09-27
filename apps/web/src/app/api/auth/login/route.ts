import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signJWT } from '../../../../lib/jwt-edge'
import { prisma } from '@medsas/database'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  rememberMe: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    const validatedData = loginSchema.parse(body)
    const { email, password, rememberMe } = validatedData

    // Kullanıcıyı bul
    console.log('🔍 Looking for user:', email.toLowerCase());
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    console.log('👤 User found:', !!user);
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        hasPassword: !!user.passwordHash
      });
    }

    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json(
        { message: 'E-posta veya şifre hatalı' },
        { status: 401 }
      )
    }

    // Şifre kontrolü
    console.log('🔐 Checking password...');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    console.log('✅ Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { message: 'E-posta veya şifre hatalı' },
        { status: 401 }
      )
    }

    // Account status kontrolü
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          message: 'Hesabınız askıya alınmıştır. Lütfen yöneticiye başvurun.',
          redirectTo: '/suspended'
        },
        { status: 403 }
      )
    }

    if (user.status === 'TRIAL_EXPIRED') {
      return NextResponse.json(
        {
          message: 'Demo süreniz sona ermiştir. Lütfen bir abonelik planı seçin.',
          redirectTo: '/subscription'
        },
        { status: 403 }
      )
    }

    // JWT token oluştur
    console.log('🎫 Creating JWT token...');
    console.log('User object check:', {
      userExists: !!user,
      hasId: !!user?.id,
      hasEmail: !!user?.email,
      hasRole: !!user?.role
    });

    if (!user || !user.id || !user.email || !user.role) {
      throw new Error(`Invalid user object: ${JSON.stringify({
        userExists: !!user,
        id: user?.id,
        email: user?.email,
        role: user?.role
      })}`);
    }

    const tokenExpiry = rememberMe ? '7d' : '1h'
    const token = await signJWT(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        trialEndDate: user.trialEndDate?.toISOString() || null
      },
      tokenExpiry
    )
    console.log('✅ JWT token created successfully');

    // Response oluştur
    console.log('🎯 Creating response...');
    const response = NextResponse.json({
      message: 'Giriş başarılı',
      user: {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        status: user?.status,
        tenantId: user?.tenantId,
        trialEndDate: user?.trialEndDate,
        approvalStatus: user?.status || 'PENDING'
      }
    })
    console.log('✅ Response created successfully');

    // Cookie set et
    const cookieExpiry = rememberMe ? 7 * 24 * 60 * 60 : 60 * 60 // 7 days or 1 hour
    response.cookies.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieExpiry,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('❌ Login error:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Geçersiz veri formatı', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Giriş işlemi sırasında bir hata oluştu',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    )
  }
}
