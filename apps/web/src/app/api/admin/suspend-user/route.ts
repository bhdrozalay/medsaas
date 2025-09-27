import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🙫 Suspend user API called')
    
    const body = await request.json()
    const { userId, reason, durationType, durationDays, canAppeal } = body
    
    console.log('Suspend request data:', { 
      userId, 
      reason, 
      durationType, 
      durationDays, 
      canAppeal 
    })
    
    // Extract email from userId if it contains tenant info
    let userEmail = userId
    if (userId && userId.includes('_')) {
      userEmail = userId.split('_').slice(1).join('_')
    }
    
    console.log('Processing suspension for email:', userEmail)
    
    // Validate required fields
    if (!reason?.trim()) {
      return NextResponse.json(
        { error: 'Askıya alma sebebi gereklidir' },
        { status: 400 }
      )
    }
    
    // Actually update user status in database
    try {
      const updatedUser = await prisma.user.update({
        where: { email: userEmail },
        data: { status: 'SUSPENDED' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true
        }
      })
      
      console.log('💾 Database updated - User suspended:', updatedUser)
      
      const result = {
        success: true,
        message: `Kullanıcı ${userEmail} başarıyla askıya alındı`,
        data: {
          user: {
            ...updatedUser,
            status: 'SUSPENDED'
          },
          suspension: {
            reason: reason.trim(),
            durationType: durationType || 'temporary',
            durationDays: parseInt(durationDays) || 0,
            canAppeal: Boolean(canAppeal),
            suspendedAt: new Date().toISOString(),
            suspendedBy: 'admin@medsas.com'
          }
        }
      }
      
      await prisma.$disconnect()
      return NextResponse.json(result)
      
    } catch (dbError) {
      console.error('💾 Database error:', dbError)
      await prisma.$disconnect()
      
      return NextResponse.json(
        { error: 'Veritabanı güncellenirken hata oluştu', details: dbError.message },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Suspend API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Askıya alma işlemi başarısız',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
