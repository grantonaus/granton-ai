import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { client } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

function extractPeriodFromInvoice(invoice: Stripe.Invoice | null): { start: Date; end: Date } | null {
  if (!invoice) return null;

  // Prefer invoice line period if present
  const linePeriod = invoice.lines?.data?.[0]?.period;
  if (linePeriod?.start && linePeriod?.end) {
    return {
      start: new Date(linePeriod.start * 1000),
      end: new Date(linePeriod.end * 1000),
    };
  }

  // Fallback to top-level invoice period_start / period_end
  const periodStart = (invoice as any).period_start;
  const periodEnd = (invoice as any).period_end;
  if (periodStart && periodEnd) {
    return {
      start: new Date(periodStart * 1000),
      end: new Date(periodEnd * 1000),
    };
  }

  return null;
}

function extractPeriodFromSubscription(subscription: Stripe.Subscription): { start: Date; end: Date } | null {
  const startEpoch = (subscription as any).current_period_start;
  const endEpoch = (subscription as any).current_period_end;
  if (startEpoch && endEpoch) {
    return {
      start: new Date(startEpoch * 1000),
      end: new Date(endEpoch * 1000),
    };
  }

  // Try latest_invoice if present
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | string | null | undefined;
  if (latestInvoice && typeof latestInvoice !== 'string') {
    const period = extractPeriodFromInvoice(latestInvoice);
    if (period) return period;
  }

  return null;
}

async function upsertSubscriptionFromStripeSub(subscription: Stripe.Subscription) {
  const userId = (subscription.metadata as any)?.userId;
  if (!userId) {
    console.warn(`Subscription ${subscription.id} missing metadata.userId; skipping`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.warn(`Subscription ${subscription.id} missing price; skipping`);
    return;
  }

  // Ensure we have period bounds; if missing, refetch with latest_invoice expanded once
  let subscriptionWithPeriod = subscription;
  let periodBounds = extractPeriodFromSubscription(subscriptionWithPeriod);
  if (!periodBounds) {
    subscriptionWithPeriod = (await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['latest_invoice'],
    })) as Stripe.Subscription;
    periodBounds = extractPeriodFromSubscription(subscriptionWithPeriod);
  }
  if (!periodBounds) {
    console.warn(`Subscription ${subscription.id} missing period bounds; skipping`);
    return;
  }
  const { start: currentPeriodStart, end: currentPeriodEnd } = periodBounds;
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const period = priceId === process.env.STRIPE_ANNUAL_PRICE_ID ? 'ANNUAL' : 'MONTHLY';

  // Ensure the user exists
  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.warn(`Subscription ${subscription.id} references missing user ${userId}; skipping`);
    return;
  }

  await client.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      plan: 'PRO',
      period,
      status,
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      plan: 'PRO',
      period,
      status,
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
    },
  });

  console.log(
    `✅ subscription upserted for user ${userId}, period=${period}, status=${status} (sub=${subscription.id})`
  );
}

function mapStripeStatusToSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' {
  const statusMap: Partial<
    Record<
      Stripe.Subscription.Status,
      'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED'
    >
  > = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    canceled: 'CANCELED',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'CANCELED',
  };
  return statusMap[stripeStatus] || 'CANCELED';
}

export async function POST(req: NextRequest) {
  console.log('📥 Webhook endpoint called');
  
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is missing');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  console.log('📦 Raw event body length:', body.length);
  console.log('📦 stripe-signature header present?', !!signature);

  if (!signature) {
    console.error('⚠️  Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`🔔  Webhook received: ${event.type} (ID: ${event.id})`);
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('🛒 Processing checkout.session.completed event');
        const sessionId = (event.data.object as Stripe.Checkout.Session).id;
        if (!sessionId) throw new Error('Session ID missing');

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items', 'subscription', 'subscription.latest_invoice', 'subscription.latest_invoice.lines'],
        });

        const userId = session.metadata?.userId;
        console.log('🔎 Session metadata:', session.metadata);

        if (!userId) throw new Error('userId missing in Checkout Session metadata');

        const user = await client.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found on checkout.session.completed');

        // Always store/update the Stripe Customer ID
        await client.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: session.customer as string },
        });

        const subscriptionObj = session.subscription as Stripe.Subscription | string | null;
        const subscriptionId =
          typeof subscriptionObj === 'string' ? subscriptionObj : subscriptionObj?.id;
        if (!subscriptionId) throw new Error('Subscription ID missing');

        const firstItem = session.line_items?.data[0];
        const priceId = firstItem?.price?.id;
        if (!priceId) throw new Error('Price ID missing in line_items');

        const period =
          priceId === process.env.STRIPE_ANNUAL_PRICE_ID ? 'ANNUAL' : 'MONTHLY';

        // Prefer expanded subscription from the session; fall back to a fresh fetch (with latest_invoice) if missing period bounds
        let subscription =
          (typeof subscriptionObj === 'object' && subscriptionObj) ||
          ((await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['latest_invoice', 'latest_invoice.lines'],
          })) as Stripe.Subscription);

        let periodBounds = extractPeriodFromSubscription(subscription);

        // Retry fetch once if period bounds are missing (Stripe CLI fixtures can omit them when not expanded)
        if (!periodBounds) {
          subscription = (await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['latest_invoice', 'latest_invoice.lines'],
          })) as Stripe.Subscription;
          periodBounds = extractPeriodFromSubscription(subscription);
        }

        // If still missing, log and return 200 to avoid breaking other events
        if (!periodBounds) {
          console.warn(`Subscription missing period bounds for ${subscriptionId}; skipping update`);
          break;
        }

        const { start: currentPeriodStart, end: currentPeriodEnd } = periodBounds;
        const status = mapStripeStatusToSubscriptionStatus(subscription.status);

        await client.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: subscriptionId,
            plan: 'PRO',
            period,
            status,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            plan: 'PRO',
            period,
            status,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
          },
        });

        console.log(
          `✅ checkout.session.completed handled for user ${userId}, period=${period}, status=${status}`
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('💰 invoice.payment_succeeded');
        const invoice = event.data.object as Stripe.Invoice;
        
        let subscriptionId: string | null = null;
        const invoiceSubscription = (invoice as any).subscription;
        if (typeof invoiceSubscription === 'string') {
          subscriptionId = invoiceSubscription;
        } else if (invoiceSubscription && typeof invoiceSubscription === 'object') {
          subscriptionId = invoiceSubscription.id;
        }

        if (!subscriptionId) {
          console.warn('invoice.payment_succeeded without subscription id');
          break;
        }

        const subRecord = await client.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (!subRecord) {
          console.warn('No subscription record for', subscriptionId);
          break;
        }

        const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as Stripe.Subscription;
        const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
        const status = mapStripeStatusToSubscriptionStatus(subscription.status);

        const priceId = subscription.items.data[0]?.price.id;
        const period = priceId === process.env.STRIPE_ANNUAL_PRICE_ID ? 'ANNUAL' : 'MONTHLY';

        // Update subscription with latest period and status
        await client.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            period,
            status,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
          },
        });

        console.log(`✅ invoice.payment_succeeded handled for user ${subRecord.userId}, status=${status}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripeSub(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        console.log('🧨 customer.subscription.deleted');
        const subscription = event.data.object as Stripe.Subscription;
        const subRecord = await client.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!subRecord) {
          console.error('No subscription record on deletion for', subscription.id);
          break;
        }

        // Optionally: delete your subscription row
        await client.subscription.delete({
          where: { stripeSubscriptionId: subscription.id },
        });

        console.log(`✅ customer.subscription.deleted handled, user ${subRecord.userId} subscription deleted`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type ${event.type}`);
    }
  } catch (err: any) {
    console.error('💥 Error handling webhook:', err);
    return NextResponse.json(
      {
        error: 'Webhook handler error',
        message: err?.message,
        eventType: (event as any)?.type,
      },
      { status: 500 }
    );
  }

  console.log(`✅ Webhook ${(event as any).type} processed successfully`);
  return NextResponse.json({ received: true }, { status: 200 });
}
