import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '../../../../lib/jwt-edge'
import { PrismaClient } from '../../../../generated/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Token bulunamadı' },
        { status: 401 }
      )
    }

    // Token verify et
    const decoded = await verifyJWT(token)
    
    // Kullanıcı bilgilerini ve durumunu getir
    console.log('Fetching user with ID:', decoded.userId)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
      // Tenant relation'u şimdilik kaldırıyoruz, sorun çıkarsa tekrar ekleriz
    })
    console.log('User found:', user ? 'yes' : 'no')

    if (!user) {
      return NextResponse.json(
        { message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Demo süresi kontrolü - ACTIVE kullanıcılar için
    if (user.status === 'ACTIVE') {
      let isDemo = false
      let isTrialExpired = false

      try {
        const profile = JSON.parse(user.profile || '{}')
        isDemo = Boolean(profile.subscription && profile.subscription.isDemoTrial)
      } catch (e) {
        // Profile parse error, check trialEndDate directly
      }

      // Demo kullanıcısı ve trial süresi kontrolü
      if (isDemo && user.trialEndDate) {
        const now = new Date()
        const endDate = new Date(user.trialEndDate)
        isTrialExpired = now > endDate

        if (isTrialExpired) {
          console.log('Demo trial expired for user:', user.email)
          return NextResponse.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            tenantId: user.tenantId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            trialExpired: true, // Frontend bunu kullanarak subscription sayfasına yönlendirecek
            redirectTo: '/subscription'
          })
        }
      }
    }

    console.log('Returning user data:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status, // PENDING_APPROVAL, ACTIVE, REJECTED, etc.
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })

  } catch (error) {
    console.error('User status endpoint error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    // JWT verification error
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { message: 'Geçersiz token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Kullanıcı durumu alınamadı',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}