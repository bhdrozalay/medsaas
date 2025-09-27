import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt-edge';
import { PrismaClient } from '../../../../generated/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Payment process API called');

    // Check authentication
    const cookieStore = cookies();
    const tokenValue = cookieStore.get('token')?.value;
    
    if (!tokenValue) {
      console.log('No token found');
      return NextResponse.json(
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    let token;
    try {
      token = await verifyJWT(tokenValue);
      console.log('Token verified successfully:', { userId: token.userId });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, paymentData } = body;
    console.log('Request body received:', { plan, paymentDataExists: !!paymentData });

    // Validate required fields
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Get user (including trial expired users)
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
        trialEndDate: true,
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Allow trial expired users to complete payment
    console.log('Payment API: User found', {
      userId: user.id,
      role: user.role,
      status: user.status,
      trialEndDate: user.trialEndDate,
      isCheckoutToken: token.isCheckoutToken || false
    });
    
    // Allow checkout tokens for trial expired users
    if (token.isCheckoutToken && token.status === 'CHECKOUT_TEMP') {
      console.log('🎫 Payment API: Using temporary checkout token');
    }

    // Plan definitions with duration support
    const plans = {
      basic: { 
        name: 'Başlangıç Paketi', 
        prices: {
          monthly: 149,
          yearly: 1490 // 10 months price for 12 months
        },
        maxPatients: 100, 
        maxUsers: 3,
        features: ['basic_reports', 'mobile_access', 'email_support']
      },
      professional: { 
        name: 'Profesyonel Paket', 
        prices: {
          monthly: 299,
          yearly: 2990 // 10 months price for 12 months
        },
        maxPatients: 500, 
        maxUsers: 10,
        features: ['advanced_reports', 'api_access', 'priority_support', 'custom_forms']
      },
      enterprise: { 
        name: 'Kurumsal Çözüm', 
        prices: {
          monthly: 599,
          yearly: 5990 // 10 months price for 12 months
        },
        maxPatients: -1, // unlimited
        maxUsers: -1, // unlimited
        features: ['ai_analytics', 'premium_support', 'custom_development', 'white_label']
      }
    };

    const selectedPlan = plans[plan as keyof typeof plans];
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // For checkout page, we default to monthly
    const duration = 'monthly';
    if (!['monthly', 'yearly'].includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid plan duration' },
        { status: 400 }
      );
    }

    const planPrice = selectedPlan.prices[duration as 'monthly' | 'yearly'];
    const durationText = duration === 'monthly' ? '30 gün' : '365 gün';
    const planDisplayName = `${selectedPlan.name} (${durationText})`;
    
    console.log('Plan details:', { plan, duration, planPrice, planDisplayName });

    // Simulate payment processing
    // In real implementation, you would integrate with a payment provider like Stripe, PayPal, etc.
    const paymentSuccessful = await simulatePaymentProcessing(paymentData, planPrice);
    
    if (!paymentSuccessful) {
      return NextResponse.json(
        { error: 'Payment failed' },
        { status: 402 }
      );
    }

    // Calculate subscription end date based on selected duration
    const subscriptionEndDate = new Date();
    if (duration === 'yearly') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user status and subscription information
      const updatedUser = await tx.user.update({
        where: { id: token.userId },
        data: { 
          status: 'ACTIVE',
          trialEndDate: subscriptionEndDate,
          // Plan bilgilerini profile JSON'ında sakla
          profile: JSON.stringify({
            subscription: {
              planId: plan,
              planName: selectedPlan.name,
              planDisplayName,
              duration,
              durationText,
              price: planPrice,
              activatedAt: new Date().toISOString(),
              isPaidSubscription: true,
              isDemoTrial: false
            }
          })
        }
      });

      // Create subscription record (you might need to add this table)
      // const subscription = await tx.subscription.create({
      //   data: {
      //     userId: token.userId,
      //     planId: planId,
      //     planName: selectedPlan.name,
      //     price: selectedPlan.price,
      //     maxPatients: selectedPlan.maxPatients,
      //     maxUsers: selectedPlan.maxUsers,
      //     features: selectedPlan.features,
      //     startDate: new Date(),
      //     endDate: trialEndDate,
      //     status: 'ACTIVE',
      //     paymentInfo: {
      //       billingName: paymentInfo.billingAddress.name,
      //       billingEmail: paymentInfo.billingAddress.email,
      //       billingCompany: paymentInfo.billingAddress.company
      //     }
      //   }
      // });

      // TODO: Create audit log entry when Prisma issues are resolved
      // Temporarily commented out due to import issues
      console.log('Subscription activated - audit log entry would be created here');

      return { updatedUser };
    });

    console.log('Subscription activated successfully:', {
      userId: token.userId,
      planId: plan,
      planName: selectedPlan.name,
      planDisplayName,
      duration,
      price: planPrice
    });

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        user: result.updatedUser,
        plan: {
          id: plan,
          name: selectedPlan.name,
          displayName: planDisplayName,
          duration,
          durationText,
          price: planPrice
        },
        subscriptionEndDate: subscriptionEndDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Simulate payment processing (replace with real payment provider integration)
async function simulatePaymentProcessing(paymentData: any, amount: number): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Basic validation
  if (!paymentData || 
      !paymentData.cardNumber || 
      !paymentData.cardholderName || 
      !paymentData.cvv || 
      !paymentData.expiryDate) {
    return false;
  }
  
  // For demo purposes, always return success
  // In real implementation, you would call your payment provider's API here
  return true;
}
