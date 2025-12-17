import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { client } from '@/lib/prisma';

/**
 * POST /api/grant-test-subscription
 * Grant a test subscription to the authenticated user (for testing purposes)
 * 
 * Body: { period?: 'MONTHLY' | 'ANNUAL' }
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Only allow in development or with explicit environment variable
    const allowTestSubscriptions =
      process.env.ALLOW_TEST_SUBSCRIPTIONS === 'true';
    
    if (!allowTestSubscriptions) {
      return NextResponse.json(
        { error: 'This endpoint is not available in production' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const period = body.period === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';

    // Find user
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (period === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create test subscription with a fake Stripe subscription ID
    const testStripeSubscriptionId = `test_sub_${userId}_${Date.now()}`;

    const subscription = await client.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: testStripeSubscriptionId,
        plan: 'PRO',
        period,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
      update: {
        stripeSubscriptionId: testStripeSubscriptionId,
        plan: 'PRO',
        period,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test subscription granted to ${user.email}`,
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
        period: subscription.period,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error: any) {
    console.error('Error granting test subscription:', error);
    return NextResponse.json(
      { error: 'Failed to grant subscription', details: error.message },
      { status: 500 }
    );
  }
}
