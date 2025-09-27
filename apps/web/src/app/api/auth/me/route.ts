import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '../../../../lib/jwt-edge'
import { PrismaClient } from '../../../../generated/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Token bulunamadı' },
        { status: 401 }
      )
    }

    // Token verify et
    const decoded = await verifyJWT(token)
    
    // Kullanıcı bilgilerini getir
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        tenantId: true,
        trialEndDate: true,
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    if (user.status === 'TRIAL_EXPIRED') {
      return NextResponse.json(
        {
          message: 'Abonelik süreniz sona ermiştir. Lütfen abonelik sayfasına yönlendirilin.',
          error: 'TRIAL_EXPIRED',
          redirectTo: '/subscription'
        },
        { status: 403 }
      )
    }

    // Trial süresi kontrolü (TENANT_ADMIN kullanıcılar için)
    if (user.role === 'TENANT_ADMIN' && user.trialEndDate) {
      const now = new Date()
      const trialEnd = new Date(user.trialEndDate)
      
      // Abonelik kontrolü yap
      let hasActiveSubscription = false
      try {
        const profile = JSON.parse(user.profile || '{}')
        hasActiveSubscription = profile.subscription && profile.subscription.activatedAt
      } catch {
        // Profile parse error, no subscription
      }
      
      if (!hasActiveSubscription && trialEnd < now) {
        return NextResponse.json(
          { 
            message: 'Demo süreniz sona ermiştir. Lütfen bir abonelik planı seçin.',
            error: 'TRIAL_EXPIRED',
            redirectTo: '/subscription'
          },
          { status: 403 }
        )
      }
    }

    // Parse subscription info from profile
    let subscriptionInfo = null
    try {
      const profile = JSON.parse(user.profile || '{}')
      if (profile.subscription) {
        subscriptionInfo = profile.subscription
      }
    } catch (error) {
      console.error('Error parsing user profile:', error)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        trialEndDate: user.trialEndDate,
        subscription: subscriptionInfo,
        tenant: null // Temporarily disabled until schema is updated
      }
    })

  } catch (error) {
    console.error('Me endpoint error:', error)
    
    // JWT verification error
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { message: 'Geçersiz token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { message: 'Kullanıcı bilgileri alınamadı' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
