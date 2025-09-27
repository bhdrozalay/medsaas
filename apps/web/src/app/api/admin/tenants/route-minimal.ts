import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🚀 Minimal tenants API called')
    
    // Hard-coded response based on our test data
    const response = {
      tenants: [
        {
          tenantId: "individual-bahadir@test.com",
          tenantName: "Bireysel Kullanıcı",
          tenantSlug: "bireysel-kullanici",
          userCount: 1,
          activeUsers: 1,
          pendingUsers: 0,
          demoUsers: 0,
          expiredTrialUsers: 0,
          subscribedUsers: 1,
          status: "ACTIVE",
          plan: "STANDARD",
          firstCreated: "2025-09-24T13:56:42.379Z",
          lastActivity: "2025-09-24T13:56:42.379Z",
          users: [
            {
              email: "bahadir@test.com",
              firstName: "BAHADIR",
              lastName: "ÖZALAY",
              phone: "",
              approvalStatus: "ACTIVE",
              createdAt: "2025-09-24T13:56:42.379Z",
              subscriptionStatus: "subscribed",
              subscriptionDetails: {
                planId: "professional",
                planName: "Profesyonel Paket",
                planDisplayName: "Profesyonel Paket (30 gün)",
                duration: "monthly",
                durationText: "30 gün",
                price: 299,
                activatedAt: "2025-09-24T15:12:39.483Z"
              },
              trialStartDate: null,
              trialEndDate: null,
              extraTrialDays: 0
            }
          ]
        }
      ],
      totalTenants: 1,
      totalUsers: 1
    }
    
    console.log('✅ Returning hard-coded response')
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Minimal API error:', error)
    return NextResponse.json(
      { error: 'API failed', details: error.message },
      { status: 500 }
    )
  }
}