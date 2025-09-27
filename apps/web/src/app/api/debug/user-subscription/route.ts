import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@medsas/database'
import { cookies } from 'next/headers'
import { verifyJWT } from '../../../../lib/jwt-edge'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // Specific user email to debug
    const searchParams = request.nextUrl.searchParams
    const userEmail = searchParams.get('email') || 'bahadir@test.com'

    console.log(`🔍 DEBUG: Checking subscription for user: ${userEmail}`)

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        tenant: true
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        email: userEmail
      }, { status: 404 })
    }

    let subscriptionData = null
    let profileData = null
    
    try {
      profileData = JSON.parse(user.profile || '{}')
      subscriptionData = profileData.subscription || null
    } catch (error) {
      console.error('Profile parse error:', error)
    }

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        trialEndDate: user.trialEndDate
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        status: user.tenant.status
      } : null,
      rawProfile: user.profile,
      parsedProfile: profileData,
      subscriptionData: subscriptionData,
      hasSubscription: !!(subscriptionData && subscriptionData.activatedAt),
      wouldAppearInTenants: !!(subscriptionData && subscriptionData.activatedAt && user.tenant)
    }

    console.log('🔍 DEBUG INFO:', JSON.stringify(debugInfo, null, 2))

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}