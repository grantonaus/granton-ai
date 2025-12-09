import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../../../../auth';
import { client } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for subscription
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const userSession = await auth();
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userSession.user.id;
    const body = await req.json().catch(() => ({}));
    const isAnnual = body.isAnnual === true;

    // Get or create Stripe customer
    let customerId: string;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true },
    });

    if (user?.stripeCustomerId) {
      // Verify customer exists in Stripe, create new one if missing
      try {
        await stripe.customers.retrieve(user.stripeCustomerId);
        customerId = user.stripeCustomerId;
      } catch {
        // Customer doesn't exist, create new one
        const customer = await stripe.customers.create({
          email: user.email || userSession.user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await client.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user?.email || userSession.user.email || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await client.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get price ID
    const priceId = isAnnual
      ? process.env.STRIPE_ANNUAL_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { 
          error: "Subscription pricing not configured", 
          details: `Missing ${isAnnual ? 'STRIPE_ANNUAL_PRICE_ID' : 'STRIPE_MONTHLY_PRICE_ID'}` 
        },
        { status: 500 }
      );
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/grant-database?subscription=success`,
      cancel_url: `${baseUrl}/?subscription=canceled`,
      metadata: {
        userId,
        planType: isAnnual ? 'annual' : 'monthly',
      },
      subscription_data: {
        metadata: {
          userId,
          planType: isAnnual ? 'annual' : 'monthly',
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session error", details: "No checkout URL returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

