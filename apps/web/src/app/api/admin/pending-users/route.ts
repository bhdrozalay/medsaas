import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '../../../../lib/jwt-edge'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
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

    // Bekleyen onay kullanıcıları
    const pendingUsers = await prisma.user.findMany({
      where: {
        status: 'PENDING_APPROVAL'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        tenantId: true,
        role: true,
        createdAt: true,
        status: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      users: pendingUsers,
      count: pendingUsers.length
    })

  } catch (error) {
    console.error('Pending users hatası:', error)
    return NextResponse.json(
      { error: 'Bekleyen kullanıcılar alınamadı' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}