import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signJWT } from '../../../../lib/jwt-edge'
import { PrismaClient } from '@medsas/database'
import { z } from 'zod'

const prisma = new PrismaClient()

const checkoutTokenSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎫 Checkout token request received')
    const body = await request.json()
    
    // Validation
    const validatedData = checkoutTokenSchema.parse(body)
    const { email, password } = validatedData

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'E-posta veya şifre hatalı' },
        { status: 401 }
      )
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'E-posta veya şifre hatalı' },
        { status: 401 }
      )
    }

    // Only allow TENANT_ADMIN users
    if (user.role !== 'TENANT_ADMIN') {
      return NextResponse.json(
        { message: 'Bu hizmet sadece kiracı yöneticileri için kullanılabilir' },
        { status: 403 }
      )
    }

    console.log('✅ Creating temporary checkout token for user:', user.email)

    // Create a temporary token for checkout only (short expiry)
    const token = await signJWT(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        status: 'CHECKOUT_TEMP', // Special status for checkout
        tenantId: user.tenantId,
        trialEndDate: user.trialEndDate?.toISOString() || null,
        isCheckoutToken: true // Special flag
      },
      '30m' // 30 minutes only
    )

    console.log('🎫 Temporary checkout token created successfully')

    // Response oluştur
    const response = NextResponse.json({
      message: 'Ödeme için geçici token oluşturuldu',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: 'CHECKOUT_TEMP',
        tenantId: user.tenantId,
        trialEndDate: user.trialEndDate
      }
    })

    // Set temporary cookie (30 minutes)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutes
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Checkout token error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Geçersiz veri formatı', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Token oluşturma sırasında bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
