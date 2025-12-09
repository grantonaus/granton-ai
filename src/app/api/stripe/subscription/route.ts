import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../../../../auth';
import { client } from '@/lib/prisma';
import { hasActiveSubscription, getSubscriptionDetails } from '@/lib/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

/**
 * GET /api/stripe/subscription
 * Get current subscription details and sync with Stripe
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const subscriptionDetails = await getSubscriptionDetails(userId);

    if (!subscriptionDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a Stripe subscription ID, sync with Stripe and update database
    if (subscriptionDetails.subscriptionId) {
      try {
        const stripeSubscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
          subscriptionDetails.subscriptionId
        );

        // Sync database with latest Stripe data
        const isActive = stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing';
        const currentPeriodEnd = (stripeSubscription as any).current_period_end 
          ? new Date((stripeSubscription as any).current_period_end * 1000)
          : null;

        // Determine plan type from subscription
        let plan = subscriptionDetails.plan;
        if (!plan && stripeSubscription.items?.data?.[0]?.price) {
          const interval = stripeSubscription.items.data[0].price.recurring?.interval;
          plan = interval === 'year' ? 'annual' : 'monthly';
        }

        // Update database with latest Stripe data
        await client.user.update({
          where: { id: userId },
          data: {
            hasPaid: isActive,
            subscriptionStatus: stripeSubscription.status,
            subscriptionPlan: plan || null,
            subscriptionEndsAt: currentPeriodEnd,
            cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end ?? false,
          },
        });

        return NextResponse.json({
          hasActiveSubscription: await hasActiveSubscription(userId),
          status: stripeSubscription.status,
          plan: plan || subscriptionDetails.plan,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end ?? false,
          cancelAt: (stripeSubscription as any).cancel_at 
            ? new Date((stripeSubscription as any).cancel_at * 1000)
            : null,
        });
      } catch (err: any) {
        console.error('Error retrieving subscription from Stripe:', err);
        // Fallback to database data
      }
    }

    return NextResponse.json({
      hasActiveSubscription: await hasActiveSubscription(userId),
      status: subscriptionDetails.status,
      plan: subscriptionDetails.plan,
      endsAt: subscriptionDetails.endsAt,
      cancelAtPeriodEnd: subscriptionDetails.cancelAtPeriodEnd,
    });
  } catch (err: any) {
    console.error("Error getting subscription:", err);
    return NextResponse.json(
      { error: "Failed to get subscription details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stripe/subscription
 * Cancel subscription (at period end)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Cancel subscription at period end (don't cancel immediately)
    const subscription: Stripe.Subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update database
    await client.user.update({
      where: { id: userId },
      data: {
        cancelAtPeriodEnd: true,
        subscriptionStatus: subscription.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    });
  } catch (err: any) {
    console.error("Error canceling subscription:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/subscription
 * Reactivate a canceled subscription
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Reactivate subscription
    const subscription: Stripe.Subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // Update database
    await client.user.update({
      where: { id: userId },
      data: {
        cancelAtPeriodEnd: false,
        subscriptionStatus: subscription.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated",
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    });
  } catch (err: any) {
    console.error("Error reactivating subscription:", err);
    return NextResponse.json(
      { error: "Failed to reactivate subscription", details: err.message },
      { status: 500 }
    );
  }
}

