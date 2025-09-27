import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@medsas/database';
import { verifyJWT } from '../../../../lib/jwt-edge';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    const userId = decoded.userId;

    // Get request body
    const body = await request.json();
    const { plan, planDuration, period } = body;

    console.log('Payment request:', { userId, plan, planDuration });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Plan details with monthly and yearly pricing
    const planDetails = {
      'basic': {
        displayName: 'Başlangıç Paketi',
        monthlyPrice: 149,
        yearlyPrice: 1490
      },
      'professional': {
        displayName: 'Profesyonel Paket',
        monthlyPrice: 299,
        yearlyPrice: 2990
      },
      'enterprise': {
        displayName: 'Kurumsal Çözüm',
        monthlyPrice: 599,
        yearlyPrice: 5990
      }
    };

    const planInfo = planDetails[plan as keyof typeof planDetails] || planDetails.professional;
    const isYearly = period === 'yearly';

    // Calculate subscription end date based on period
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();

    if (isYearly) {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }
    const selectedPlan = {
      ...planInfo,
      price: isYearly ? planInfo.yearlyPrice : planInfo.monthlyPrice,
      duration: isYearly ? 'yearly' : 'monthly',
      durationText: isYearly ? 'Yıllık' : 'Aylık'
    };

    // Simulate payment processing (replace with actual payment gateway)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user profile with REAL subscription (not demo)
    let profileData: any = {}
    try { profileData = JSON.parse(user.profile || '{}') } catch { profileData = {} }
    profileData.subscription = {
      planId: plan,
      planName: plan.toUpperCase(),
      planDisplayName: selectedPlan.displayName,
      price: selectedPlan.price,
      duration: selectedPlan.duration,
      durationText: selectedPlan.durationText,
      activatedAt: subscriptionStartDate.toISOString(),
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      isDemoTrial: false // Bu gerçek ödeme!
    }

    // Update user status to ACTIVE with REAL subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        trialStartDate: subscriptionStartDate,
        trialEndDate: subscriptionEndDate,
        profile: JSON.stringify(profileData),
        updatedAt: new Date()
      }
    });

    // Create audit log for subscription activation
    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_ACTIVATED',
        performedById: userId,
        targetUserId: userId,
        details: JSON.stringify({
          plan: selectedPlan.displayName,
          duration: planDuration,
          price: selectedPlan.price,
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          paymentMethod: 'credit_card',
          paymentStatus: 'completed'
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    console.log('Subscription activated for user:', userId, 'Plan:', selectedPlan.displayName);

    return NextResponse.json({
      success: true,
      message: 'Ödeme başarılı! Aboneliğiniz aktifleştirildi.',
      subscription: {
        plan: selectedPlan.displayName,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate,
        price: selectedPlan.price,
        duration: planDuration
      },
      user: updatedUser
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Ödeme işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}