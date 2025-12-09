
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { client } from '@/lib/prisma'; // or wherever your Prisma client lives


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  // 1) Read the raw request body as text (App Router does NOT parse it for you):
  const rawBody = await req.text();

  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    console.error('⚠️ Missing Stripe signature header');
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  // 3) Verify the event. If this fails, we return 400.
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log(`📥 Webhook event received: ${event.type} (ID: ${event.id})`);
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Helper function to update subscription data
  const updateSubscriptionData = async (
    userId: string,
    subscription: Stripe.Subscription,
    planType?: string
  ) => {
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const currentPeriodEnd = subscription.current_period_end;
    const endsAt = currentPeriodEnd 
      ? new Date(currentPeriodEnd * 1000)
      : null;

    // Determine plan type from subscription metadata or price
    let plan = planType;
    if (!plan && subscription.items?.data?.[0]?.price) {
      const interval = subscription.items.data[0].price.recurring?.interval;
      plan = interval === 'year' ? 'annual' : 'monthly';
    }

    await client.user.update({
      where: { id: userId },
      data: {
        hasPaid: isActive,
        paidAt: isActive ? new Date() : null,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: plan || null,
        subscriptionEndsAt: endsAt,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      },
    });
  };

  // 4) Handle the event types you care about
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.metadata?.userId;
        const planType = session.metadata?.planType as string | undefined;
        const customerId = session.customer as string | null;
      
        if (!userId) {
          console.error('⚠️ No userId in metadata for checkout session:', session.id);
          // Try to find user by customer ID as fallback
          if (customerId) {
            const user = await client.user.findFirst({
              where: { stripeCustomerId: customerId },
            });
            if (user) {
              userId = user.id;
              console.log(`✅ Found user by customer ID: ${user.id}`);
            } else {
              console.error(`⚠️ Could not find user by customer ID: ${customerId}`);
              return NextResponse.json({ received: true });
            }
          } else {
            return NextResponse.json({ received: true });
          }
        }

        // Only handle subscription checkouts (one-time payments removed)
        if (session.mode !== 'subscription') {
          console.warn(`⚠️ Non-subscription checkout session for userId: ${userId}`);
          return NextResponse.json({ received: true });
        }

        const subscriptionId = session.subscription as string | null;
        
        if (!subscriptionId) {
          console.error(`⚠️ No subscription ID in checkout session for userId: ${userId}`);
          return NextResponse.json({ received: true });
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Ensure customer ID is set in database if not already set
          if (customerId && userId) {
            const user = await client.user.findUnique({
              where: { id: userId },
              select: { stripeCustomerId: true },
            });
            
            if (!user?.stripeCustomerId) {
              await client.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
              });
              console.log(`✅ Updated customer ID for user ${userId}`);
            }
          }
          
          await updateSubscriptionData(userId, subscription, planType);
          console.log(`✅ Checkout completed for subscription, userId: ${userId}, status: ${subscription.status}, subscriptionId: ${subscriptionId}`);
        } catch (err) {
          console.error(`⚠️ Error retrieving subscription ${subscriptionId}:`, err);
          // Don't fallback - subscription.created/updated events will handle it
          throw err;
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Try to find user by Stripe customer ID first
        let user = await client.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        // Fallback: If not found, try to find by userId in subscription metadata
        if (!user && subscription.metadata?.userId) {
          console.log(`⚠️ User not found by customer ID ${customerId}, trying userId from metadata: ${subscription.metadata.userId}`);
          user = await client.user.findUnique({
            where: { id: subscription.metadata.userId },
          });
          
          // If found by userId, update the customer ID in database
          if (user) {
            await client.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: customerId },
            });
            console.log(`✅ Updated customer ID for user ${user.id} to ${customerId}`);
          }
        }

        // Last resort: Get customer from Stripe and try to find by email
        if (!user) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer && !customer.deleted && typeof customer === 'object' && 'email' in customer && customer.email) {
              user = await client.user.findUnique({
                where: { email: customer.email },
              });
              
              if (user) {
                // Update customer ID
                await client.user.update({
                  where: { id: user.id },
                  data: { stripeCustomerId: customerId },
                });
                console.log(`✅ Found user by email and updated customer ID for user ${user.id}`);
              }
            }
          } catch (err) {
            console.error(`⚠️ Error retrieving customer ${customerId}:`, err);
          }
        }

        if (!user) {
          console.error(`⚠️ No user found for customer ${customerId}. Subscription ID: ${subscription.id}, Metadata:`, subscription.metadata);
          break;
        }

        // Get plan type from subscription metadata if available
        const planType = subscription.metadata?.planType;

        await updateSubscriptionData(user.id, subscription, planType);
        console.log(`✅ Updated subscription for user ${user.id}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await client.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await client.user.update({
            where: { id: user.id },
            data: { 
              hasPaid: false,
              paidAt: null,
              subscriptionStatus: 'canceled',
              subscriptionEndsAt: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000)
                : new Date(),
              cancelAtPeriodEnd: false,
            },
          });
          console.log(`✅ Cancelled subscription for user ${user.id}`);
        } else {
          console.error(`⚠️ No user found for customer ${customerId} when deleting subscription`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Only process subscription invoices
        const subscription = (invoice as any).subscription;
        const subscriptionId = subscription 
          ? (typeof subscription === 'string' ? subscription : (subscription as Stripe.Subscription).id)
          : null;

        if (!subscriptionId) {
          // Not a subscription invoice, skip
          break;
        }

        const user = await client.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) {
          console.error(`⚠️ No user found for customer ${customerId} when processing invoice`);
          break;
        }

        // Retrieve subscription to get full details
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const planType = subscription.metadata?.planType;
          await updateSubscriptionData(user.id, subscription, planType);
          console.log(`✅ Recurring payment succeeded for user ${user.id}, invoice: ${invoice.id}`);
        } catch (err) {
          console.error(`⚠️ Error retrieving subscription ${subscriptionId}:`, err);
          // Fallback: just mark as paid
          await client.user.update({
            where: { id: user.id },
            data: { 
              hasPaid: true,
              paidAt: new Date(),
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Only process subscription invoices
        const subscription = (invoice as any).subscription;
        const subscriptionId = subscription 
          ? (typeof subscription === 'string' ? subscription : (subscription as Stripe.Subscription).id)
          : null;

        if (!subscriptionId) {
          break;
        }

        const user = await client.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!user) {
          break;
        }

        // Check subscription status - only revoke if truly past_due or unpaid
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const shouldRevoke = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(subscription.status);
          
          if (shouldRevoke) {
            await client.user.update({
              where: { id: user.id },
              data: { 
                hasPaid: false,
                subscriptionStatus: subscription.status,
              },
            });
            console.log(`⚠️ Payment failed for user ${user.id}, subscription status: ${subscription.status}`);
          }
        } catch (err) {
          console.error(`⚠️ Error retrieving subscription ${subscriptionId}:`, err);
        }
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('❌  Error in webhook logic:', err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  // 5) Return a 200 to tell Stripe we got it
  return NextResponse.json({ received: true }, { status: 200 });
}
