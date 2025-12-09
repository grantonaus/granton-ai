import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../../../../auth';
import { client } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

/**
 * POST /api/stripe/sync-subscription
 * Manually sync subscription status from Stripe to database
 * Useful for debugging or fixing mismatched data
 */
export async function POST(req: NextRequest) {
  try {
    const userSession = await auth();

    if (!userSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userSession.user.id;

    // Get user from database
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to find subscription by customer ID or subscription ID
    let subscription: Stripe.Subscription | null = null;

    if (user.stripeSubscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        console.log(`Found subscription by ID: ${user.stripeSubscriptionId}`);
      } catch (err: any) {
        console.warn(`Subscription ${user.stripeSubscriptionId} not found, trying customer ID`);
      }
    }

    // If not found by subscription ID, try to find by customer ID
    if (!subscription && user.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          limit: 1,
          status: 'all',
        });
        
        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          console.log(`Found subscription by customer ID: ${user.stripeCustomerId}`);
        }
      } catch (err: any) {
        console.error(`Error listing subscriptions for customer ${user.stripeCustomerId}:`, err);
      }
    }

    // If still not found, try to find customer by email and then subscriptions
    if (!subscription && user.email) {
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          const customer = customers.data[0];
          // Update customer ID in database
          await client.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
          });
          
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 1,
            status: 'all',
          });
          
          if (subscriptions.data.length > 0) {
            subscription = subscriptions.data[0];
            console.log(`Found subscription by email: ${user.email}`);
          }
        }
      } catch (err: any) {
        console.error(`Error finding customer by email:`, err);
      }
    }

    if (!subscription) {
      return NextResponse.json({ 
        error: "No active subscription found in Stripe",
        details: "Make sure you have completed a purchase and the subscription exists in Stripe"
      }, { status: 404 });
    }

    // Update database with subscription data
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const currentPeriodEnd = (subscription as any).current_period_end as number | null | undefined;
    const endsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;

    // Determine plan type
    let plan: string | null = subscription.metadata?.planType || null;
    if (!plan && subscription.items?.data?.[0]?.price) {
      const interval = subscription.items.data[0].price.recurring?.interval;
      plan = interval === 'year' ? 'annual' : 'monthly';
    }

    await client.user.update({
      where: { id: userId },
      data: {
        hasPaid: isActive,
        paidAt: isActive ? new Date() : null,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: plan,
        subscriptionEndsAt: endsAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: plan,
        endsAt: endsAt,
      },
    });
  } catch (err: any) {
    console.error("Error syncing subscription:", err);
    return NextResponse.json(
      { error: "Failed to sync subscription", details: err.message },
      { status: 500 }
    );
  }
}

