import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '../../../../lib/jwt-edge'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
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

    // Trial süresi dolan TENANT_ADMIN kullanıcıları bul
    const now = new Date()
    const expiredUsers = await prisma.user.findMany({
      where: {
        role: 'TENANT_ADMIN',
        trialEndDate: {
          lt: now
        },
        // Aktif aboneliği olmayan kullanıcılar
        NOT: {
          profile: {
            contains: '"subscription"'
          }
        }
      },
      select: {
        id: true,
        email: true,
        trialEndDate: true
      }
    })

    console.log(`Found ${expiredUsers.length} expired users without active subscription`)

    // Bu kullanıcıların session'larını temizle (eğer session management var ise)
    // Şu an token-based olduğu için server'da session yok
    // Client'lar kendi token'larını kontrol etmeli

    return NextResponse.json({
      success: true,
      message: `${expiredUsers.length} süresi dolan kullanıcı bulundu`,
      expiredUsers: expiredUsers.map(user => ({
        id: user.id,
        email: user.email,
        trialEndDate: user.trialEndDate
      }))
    })

  } catch (error) {
    console.error('Expired users logout error:', error)
    return NextResponse.json(
      { error: 'İşlem başarısız' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}