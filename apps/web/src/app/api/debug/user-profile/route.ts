import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt-edge';
import { PrismaClient } from '../../../../generated/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        profile: true,
        status: true,
        role: true,
        trialEndDate: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let parsedProfile = null;
    try {
      parsedProfile = JSON.parse(user.profile || '{}');
    } catch (error) {
      parsedProfile = { error: 'Could not parse profile JSON', raw: user.profile };
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
      trialEndDate: user.trialEndDate,
      rawProfile: user.profile,
      parsedProfile
    });

  } catch (error) {
    console.error('Debug user profile error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}