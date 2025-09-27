import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '../../../../lib/jwt-edge'
import { prisma } from '@medsas/database'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Token bulunamadı' }, { status: 401 })
    }

    const decoded = await verifyJWT(token)
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // Dashboard istatistikleri
    const totalUsers = await prisma.user.count();
    const totalTenants = Math.floor(totalUsers / 3); // Yaklaşık tenant sayısı

    const [
      pendingUsers,
      activeUsers,
      recentActivity
    ] = await Promise.all([
      // Bekleyen onay sayısı
      prisma.user.count({
        where: {
          status: 'PENDING_VERIFICATION'
        }
      }),
      
      // Aktif kullanıcı sayısı
      prisma.user.count({
        where: {
          status: 'ACTIVE'
        }
      }),
      
      // Son aktiviteler (yakın zamanda kayıt olan kullanıcılar)
      prisma.user.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true
        }
      })
    ])

    // Son aktiviteleri formatla
    const formattedActivity = recentActivity.map(user => ({
      id: user.id,
      type: 'user_registration',
      description: `${user.email} kaydı oluşturuldu`,
      timestamp: user.createdAt.toISOString()
    }))

    const stats = {
      totalUsers,
      totalTenants,
      pendingUsers,
      activeUsers,
      recentActivity: formattedActivity
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats hatası:', error)
    return NextResponse.json(
      { error: 'Dashboard istatistikleri alınamadı' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}