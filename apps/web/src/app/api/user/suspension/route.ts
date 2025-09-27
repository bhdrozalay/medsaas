import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Get user suspension details API called');

    // Check authentication
    const token = await getToken({ req: request });
    
    if (!token) {
      console.log('No token found');
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    // Get user's active suspension
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        suspensions: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            reason: true,
            durationType: true,
            durationDays: true,
            suspendedUntil: true,
            canAppeal: true,
            appealDeadline: true,
            hasAppealed: true,
            appealReason: true,
            appealedAt: true,
            appealStatus: true,
            appealReviewedAt: true,
            appealReviewedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            createdAt: true,
            suspendedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.status !== 'SUSPENDED') {
      return NextResponse.json(
        { error: 'User is not suspended' },
        { status: 400 }
      );
    }

    if (!user.suspensions || user.suspensions.length === 0) {
      return NextResponse.json(
        { error: 'No active suspension found' },
        { status: 404 }
      );
    }

    const suspension = user.suspensions[0];

    // Check if temporary suspension has expired
    let isExpired = false;
    if (suspension.durationType === 'TEMPORARY' && suspension.suspendedUntil) {
      isExpired = new Date() > new Date(suspension.suspendedUntil);
      
      if (isExpired) {
        // Auto-reactivate user if suspension has expired
        await prisma.$transaction(async (tx) => {
          // Update user status
          await tx.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' }
          });

          // Deactivate suspension
          await tx.suspension.update({
            where: { id: suspension.id },
            data: { 
              isActive: false,
              updatedAt: new Date()
            }
          });

          // Create audit log
          await tx.auditLog.create({
            data: {
              action: 'SUSPENSION_EXPIRED',
              performedById: null, // System action
              targetUserId: user.id,
              details: {
                suspensionId: suspension.id,
                expiredAt: new Date().toISOString()
              },
              ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown',
              createdAt: new Date()
            }
          });
        });

        return NextResponse.json(
          { error: 'Suspension has expired. Please refresh the page.' },
          { status: 410 } // Gone
        );
      }
    }

    // Calculate remaining time for temporary suspension
    let remainingDays = null;
    let remainingHours = null;
    if (suspension.durationType === 'TEMPORARY' && suspension.suspendedUntil) {
      const now = new Date();
      const endDate = new Date(suspension.suspendedUntil);
      const diffMs = endDate.getTime() - now.getTime();
      
      if (diffMs > 0) {
        remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        remainingHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      }
    }

    // Check if appeal deadline has passed
    let canAppealNow = false;
    if (suspension.canAppeal && !suspension.hasAppealed && suspension.appealDeadline) {
      canAppealNow = new Date() <= new Date(suspension.appealDeadline);
    }

    const response = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      },
      suspension: {
        id: suspension.id,
        reason: suspension.reason,
        durationType: suspension.durationType,
        durationDays: suspension.durationDays,
        suspendedUntil: suspension.suspendedUntil,
        canAppeal: suspension.canAppeal,
        canAppealNow,
        appealDeadline: suspension.appealDeadline,
        hasAppealed: suspension.hasAppealed,
        appealReason: suspension.appealReason,
        appealedAt: suspension.appealedAt,
        appealStatus: suspension.appealStatus,
        appealReviewedAt: suspension.appealReviewedAt,
        appealReviewedBy: suspension.appealReviewedBy,
        createdAt: suspension.createdAt,
        suspendedBy: suspension.suspendedBy,
        remainingDays,
        remainingHours,
        isExpired
      }
    };

    console.log('Suspension details retrieved successfully:', {
      userId: user.id,
      suspensionId: suspension.id,
      durationType: suspension.durationType
    });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error getting suspension details:', error);
    
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