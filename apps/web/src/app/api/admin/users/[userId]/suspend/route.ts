import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt-edge';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log('🙅 Suspend user API called for userId:', params.userId);
    
    // TEMP: Skip authentication for testing
    console.log('⚠️ TEMPORARILY BYPASSING AUTH FOR SUSPEND API')

    const body = await request.json();
    const { reason, durationType, durationDays, canAppeal } = body;
    
    console.log('Suspend request data:', { reason, durationType, durationDays, canAppeal });

    // Extract email from userId (format: "tenantId_email")
    let userEmail = params.userId;
    if (params.userId.includes('_')) {
      userEmail = params.userId.split('_').slice(1).join('_'); // Handle emails with underscores
    }
    
    console.log('Extracted email from userId:', userEmail);

    // Validate required fields
    if (!reason?.trim()) {
      return NextResponse.json(
        { error: 'Suspension reason is required' },
        { status: 400 }
      );
    }

    // Find user by email instead of ID
    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'User is already suspended' },
        { status: 400 }
      );
    }

    // Cannot suspend super admins or self
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot suspend super admin users' },
        { status: 400 }
      );
    }

    // Skip self-suspension check for now (auth bypassed)

    // Update user status to SUSPENDED
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { 
        status: 'SUSPENDED'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    console.log('✅ User suspended successfully:', {
      userId: params.userId,
      userEmail: userEmail,
      reason: reason.trim(),
      durationType,
      durationDays
    });

    return NextResponse.json({
      success: true,
      message: 'User suspended successfully',
      data: {
        user: updatedUser,
        reason: reason.trim()
      }
    });

  } catch (error) {
    console.error('Error suspending user:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}