import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        trialEndDate: true,
        profile: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    let hasActiveSubscription = false
    let profileData = null

    try {
      profileData = JSON.parse(user.profile || '{}')
      hasActiveSubscription = profileData.subscription && profileData.subscription.activatedAt
    } catch {
      // Profile parse error
    }

    const isTrialExpired = user.trialEndDate && new Date(user.trialEndDate) < now

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        trialEndDate: user.trialEndDate,
        createdAt: user.createdAt
      },
      trialInfo: {
        trialEndDate: user.trialEndDate,
        currentDate: now,
        isTrialExpired,
        hasActiveSubscription,
        profileData
      },
      decision: {
        shouldBlockLogin: user.role === 'TENANT_ADMIN' && isTrialExpired && !hasActiveSubscription,
        message: user.role === 'TENANT_ADMIN' && isTrialExpired && !hasActiveSubscription 
          ? 'TRIAL_EXPIRED - Login should be blocked' 
          : 'Login should be allowed'
      }
    })

  } catch (error) {
    console.error('Debug user trial error:', error)
    return NextResponse.json(
      { error: 'Debug query failed' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}