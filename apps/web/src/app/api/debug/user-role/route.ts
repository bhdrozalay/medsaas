import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '../../../../lib/jwt-edge'
import { PrismaClient } from '@medsas/database'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ 
        error: 'No token found',
        hasToken: false 
      }, { status: 401 })
    }

    console.log('Debug: Token found in cookies')

    // Token verify et
    const decoded = await verifyJWT(token)
    console.log('Debug: Token decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      status: decoded.status,
      tenantId: decoded.tenantId
    })

    // Database'den kullanıcı bilgilerini getir
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        trialEndDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found in database',
        tokenData: decoded
      }, { status: 404 })
    }

    console.log('Debug: User found in database:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId
    })

    return NextResponse.json({
      success: true,
      tokenData: decoded,
      databaseData: user,
      rolesMatch: decoded.role === user.role,
      canAccessTenantAdmin: user.role === 'TENANT_ADMIN' || user.role === 'ADMIN'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    
    return NextResponse.json({
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}