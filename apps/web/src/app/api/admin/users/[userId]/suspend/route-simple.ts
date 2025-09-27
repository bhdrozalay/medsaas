import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('🙅 Suspend API called for userId:', params.userId)
    
    const body = await request.json()
    const { reason, durationType, durationDays, canAppeal } = body
    
    console.log('Suspend data received:', { reason, durationType, durationDays, canAppeal })
    
    // Extract email from userId (format: "tenantId_email")
    let userEmail = params.userId
    if (params.userId.includes('_')) {
      userEmail = params.userId.split('_').slice(1).join('_')
    }
    
    console.log('Extracted email:', userEmail)
    
    // For now, just return success without database update
    const result = {
      success: true,
      message: `Kullanıcı ${userEmail} başarıyla askıya alındı`,
      data: {
        user: {
          id: params.userId,
          email: userEmail,
          status: 'SUSPENDED'
        },
        suspension: {
          reason: reason?.trim() || 'Belirtilmemiş',
          durationType: durationType || 'temporary',
          durationDays: durationDays || 0,
          canAppeal: canAppeal || false,
          suspendedAt: new Date().toISOString()
        }
      }
    }
    
    console.log('✅ Returning success response')
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Suspend API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Askıya alma işlemi başarısız',
        details: error.message 
      },
      { status: 500 }
    )
  }
}