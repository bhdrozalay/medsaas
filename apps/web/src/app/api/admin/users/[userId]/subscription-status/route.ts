import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '../../../../../../lib/jwt-edge'
import { PrismaClient } from '../../../../../../generated/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    
    if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { userId } = params

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        trialStartDate: true,
        trialEndDate: true,
        updatedAt: true,
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has paid subscription (ACTIVE status with valid trial/subscription dates)
    const hasSubscription = user.status === 'ACTIVE' && user.trialEndDate

    if (!hasSubscription) {
      return NextResponse.json({
        hasSubscription: false,
        userStatus: user.status
      })
    }

    // Parse subscription details from user profile
    let subscriptionDetails = null
    
    try {
      const profile = JSON.parse(user.profile || '{}')
      const subscriptionInfo = profile.subscription
      
      if (subscriptionInfo) {
        subscriptionDetails = {
          planId: subscriptionInfo.planId,
          planName: subscriptionInfo.planName,
          planDisplayName: subscriptionInfo.planDisplayName,
          duration: subscriptionInfo.duration,
          durationText: subscriptionInfo.durationText,
          price: subscriptionInfo.price,
          activatedAt: subscriptionInfo.activatedAt,
          trialEndDate: user.trialEndDate?.toISOString(),
          status: user.status
        }
      } else {
        // Fallback: Calculate subscription type based on trial duration and dates
        const trialEndDate = user.trialEndDate ? new Date(user.trialEndDate) : null
        const trialStartDate = user.trialStartDate ? new Date(user.trialStartDate) : null
        
        let duration = 'monthly'
        let planName = 'Aktif Plan'
        
        if (trialEndDate && trialStartDate) {
          const diffTime = Math.abs(trialEndDate.getTime() - trialStartDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 300) {
            duration = 'yearly'
            planName = 'Yıllık Plan'
          } else {
            duration = 'monthly'
            planName = 'Aylık Plan'
          }
        }
        
        subscriptionDetails = {
          planId: 'legacy_plan',
          planName: planName,
          planDisplayName: `${planName} (${duration === 'monthly' ? '30 gün' : '365 gün'})`,
          duration: duration,
          durationText: duration === 'monthly' ? '30 gün' : '365 gün',
          price: duration === 'monthly' ? 149 : 1490,
          activatedAt: user.updatedAt?.toISOString(),
          trialEndDate: trialEndDate?.toISOString(),
          status: user.status
        }
      }
    } catch (error) {
      console.error('Error parsing user profile:', error)
      
      // Default fallback
      subscriptionDetails = {
        planId: 'unknown_plan',
        planName: 'Aktif Plan',
        planDisplayName: 'Aktif Plan (30 gün)',
        duration: 'monthly',
        durationText: '30 gün',
        price: 149,
        activatedAt: user.updatedAt?.toISOString(),
        trialEndDate: user.trialEndDate?.toISOString(),
        status: user.status
      }
    }

    return NextResponse.json({
      hasSubscription: true,
      subscriptionDetails
    })

  } catch (error) {
    console.error('Subscription status check error:', error)
    return NextResponse.json(
      { error: 'Abonelik durumu kontrol edilemedi' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}