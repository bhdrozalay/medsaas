import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🚀 Dynamic tenants API called')
    
    // Import Prisma dynamically to avoid build issues
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const users = await prisma.user.findMany({
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          profile: true
        }
      })
      
      const subscriptionUsers = users.filter(u => 
        u.profile && u.profile.includes('subscription')
      )
      
      if (subscriptionUsers.length === 0) {
        return NextResponse.json({
          tenants: [],
          totalTenants: 0,
          totalUsers: 0
        })
      }
      
      const tenants = subscriptionUsers.map(user => {
        let subscriptionDetails = null
        try {
          const profile = JSON.parse(user.profile || '{}')
          subscriptionDetails = profile.subscription
        } catch (e) {
          console.error('Profile parse error:', e)
        }
        
        return {
          tenantId: `individual-${user.email}`,
          tenantName: "Bireysel Kullanıcı",
          tenantSlug: "bireysel-kullanici",
          userCount: 1,
          activeUsers: user.status === 'ACTIVE' ? 1 : 0,
          pendingUsers: 0,
          demoUsers: 0,
          expiredTrialUsers: 0,
          subscribedUsers: 1,
          status: "ACTIVE",
          plan: "STANDARD",
          firstCreated: user.createdAt.toISOString(),
          lastActivity: user.createdAt.toISOString(),
          users: [{
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || "",
            approvalStatus: user.status,
            createdAt: user.createdAt,
            subscriptionStatus: "subscribed",
            subscriptionDetails,
            trialStartDate: null,
            trialEndDate: null,
            extraTrialDays: 0
          }]
        }
      })
      
      await prisma.$disconnect()
      
      return NextResponse.json({
        tenants,
        totalTenants: tenants.length,
        totalUsers: tenants.length
      })
      
    } catch (dbError) {
      console.error('Database error, falling back to hard-coded data:', dbError)
      await prisma.$disconnect()
      
      // Fallback to hard-coded data if DB fails
      return NextResponse.json({
        tenants: [{
          tenantId: "individual-bahadir@test.com",
          tenantName: "Bireysel Kullanıcı", 
          userCount: 1,
          users: [{
            email: "bahadir@test.com",
            firstName: "BAHADIR",
            lastName: "ÖZALAY",
            subscriptionStatus: "subscribed"
          }]
        }],
        totalTenants: 1,
        totalUsers: 1
      })
    }
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'API failed', details: error.message },
      { status: 500 }
    )
  }
}

// To use this dynamic version:
// Copy this file over route.ts when you want real database data