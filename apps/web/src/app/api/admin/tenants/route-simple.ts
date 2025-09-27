import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('🚀 Simple tenants API called')
    
    // En basit test
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        profile: true
      }
    })
    
    console.log(`Found ${users.length} users`)
    
    // Subscription'lı kullanıcıları filtrele
    const usersWithSubscription = users.filter(user => 
      user.profile && user.profile.includes('subscription')
    )
    
    console.log(`Found ${usersWithSubscription.length} users with subscription`)
    
    if (usersWithSubscription.length === 0) {
      return NextResponse.json({
        tenants: [],
        totalTenants: 0,
        totalUsers: 0
      })
    }
    
    // Basit tenant structure
    const tenants = usersWithSubscription.map(user => {
      let subscriptionDetails = null
      try {
        const profile = JSON.parse(user.profile)
        subscriptionDetails = profile.subscription
      } catch (e) {
        console.error('Profile parse error:', e)
      }
      
      return {
        tenantId: `individual-${user.email}`,
        tenantName: 'Bireysel Kullanıcı',
        tenantSlug: 'bireysel-kullanici',
        userCount: 1,
        activeUsers: user.status === 'ACTIVE' ? 1 : 0,
        pendingUsers: 0,
        demoUsers: 0,
        expiredTrialUsers: 0,
        subscribedUsers: 1,
        status: 'ACTIVE',
        plan: 'STANDARD',
        firstCreated: user.createdAt.toISOString(),
        lastActivity: user.createdAt.toISOString(),
        users: [{
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: '',
          approvalStatus: user.status,
          createdAt: user.createdAt,
          subscriptionStatus: 'subscribed',
          subscriptionDetails,
          trialStartDate: null,
          trialEndDate: null,
          extraTrialDays: 0
        }]
      }
    })
    
    console.log('Returning result:', { totalTenants: tenants.length, totalUsers: tenants.length })
    
    return NextResponse.json({
      tenants,
      totalTenants: tenants.length,
      totalUsers: tenants.length
    })
    
  } catch (error) {
    console.error('Simple tenants API error:', error)
    return NextResponse.json(
      { error: 'Failed to get tenants', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}