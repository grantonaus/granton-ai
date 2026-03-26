import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { client } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/** Stripe API returns period fields; generated TS types may lag behind API versions. */
function subscriptionPeriodEpoch(sub: Stripe.Subscription): {
  start: number;
  end: number;
} | null {
  const r = sub as unknown as Record<string, unknown>;
  const start = r.current_period_start;
  const end = r.current_period_end;
  if (typeof start === "number" && typeof end === "number") {
    return { start, end };
  }
  return null;
}

function extractPeriodFromInvoice(
  invoice: Stripe.Invoice | null
): { start: Date; end: Date } | null {
  if (!invoice) return null;

  const linePeriod = invoice.lines?.data?.[0]?.period;
  if (linePeriod?.start != null && linePeriod?.end != null) {
    return {
      start: new Date(linePeriod.start * 1000),
      end: new Date(linePeriod.end * 1000),
    };
  }

  const inv = invoice as unknown as Record<string, unknown>;
  if (typeof inv.period_start === "number" && typeof inv.period_end === "number") {
    return {
      start: new Date(inv.period_start * 1000),
      end: new Date(inv.period_end * 1000),
    };
  }

  return null;
}

function extractPeriodFromSubscription(
  subscription: Stripe.Subscription
): { start: Date; end: Date } | null {
  const epoch = subscriptionPeriodEpoch(subscription);
  if (epoch) {
    return {
      start: new Date(epoch.start * 1000),
      end: new Date(epoch.end * 1000),
    };
  }

  const latestInvoice = subscription.latest_invoice;
  if (latestInvoice && typeof latestInvoice !== "string") {
    const period = extractPeriodFromInvoice(latestInvoice);
    if (period) return period;
  }

  return null;
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const sub = (invoice as unknown as Record<string, unknown>).subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && sub !== null && "id" in sub) {
    return String((sub as { id: string }).id);
  }
  return null;
}

async function upsertSubscriptionFromStripeSub(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.warn(`Subscription ${subscription.id} missing metadata.userId; skipping`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.warn(`Subscription ${subscription.id} missing price; skipping`);
    return;
  }

  let subscriptionWithPeriod = subscription;
  let periodBounds = extractPeriodFromSubscription(subscriptionWithPeriod);
  if (!periodBounds) {
    subscriptionWithPeriod = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ["latest_invoice"],
    });
    periodBounds = extractPeriodFromSubscription(subscriptionWithPeriod);
  }
  if (!periodBounds) {
    console.warn(`Subscription ${subscription.id} missing period bounds; skipping`);
    return;
  }
  const { start: currentPeriodStart, end: currentPeriodEnd } = periodBounds;
  const status = mapStripeStatusToSubscriptionStatus(subscription.status);
  const period =
    priceId === process.env.STRIPE_ANNUAL_PRICE_ID ? "ANNUAL" : "MONTHLY";

  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.warn(
      `Subscription ${subscription.id} references missing user ${userId}; skipping`
    );
    return;
  }

  await client.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      plan: "PRO",
      period,
      status,
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      plan: "PRO",
      period,
      status,
      startDate: currentPeriodStart,
      endDate: currentPeriodEnd,
    },
  });

  console.log(
    `subscription upserted for user ${userId}, period=${period}, status=${status} (sub=${subscription.id})`
  );
}

function mapStripeStatusToSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
):
  | "ACTIVE"
  | "TRIALING"
  | "CANCELED"
  | "PAST_DUE"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED" {
  const statusMap: Partial<
    Record<
      Stripe.Subscription.Status,
      | "ACTIVE"
      | "TRIALING"
      | "CANCELED"
      | "PAST_DUE"
      | "UNPAID"
      | "INCOMPLETE"
      | "INCOMPLETE_EXPIRED"
    >
  > = {
    active: "ACTIVE",
    trialing: "TRIALING",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    paused: "CANCELED",
  };
  return statusMap[stripeStatus] || "CANCELED";
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is missing");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "verification failed";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sessionId = (event.data.object as Stripe.Checkout.Session).id;
        if (!sessionId) throw new Error("Session ID missing");

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: [
            "line_items",
            "subscription",
            "subscription.latest_invoice",
            "subscription.latest_invoice.lines",
          ],
        });

        const userId = session.metadata?.userId;
        if (!userId) throw new Error("userId missing in Checkout Session metadata");

        const user = await client.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found on checkout.session.completed");

        await client.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: session.customer as string },
        });

        const subscriptionObj = session.subscription;
        const subscriptionId =
          typeof subscriptionObj === "string"
            ? subscriptionObj
            : subscriptionObj?.id;
        if (!subscriptionId) throw new Error("Subscription ID missing");

        const firstItem = session.line_items?.data[0];
        const priceId = firstItem?.price?.id;
        if (!priceId) throw new Error("Price ID missing in line_items");

        const period =
          priceId === process.env.STRIPE_ANNUAL_PRICE_ID ? "ANNUAL" : "MONTHLY";

        let subscription: Stripe.Subscription =
          typeof subscriptionObj === "object" && subscriptionObj
            ? subscriptionObj
            : await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ["latest_invoice", "latest_invoice.lines"],
              });

        let periodBounds = extractPeriodFromSubscription(subscription);

        if (!periodBounds) {
          subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["latest_invoice", "latest_invoice.lines"],
          });
          periodBounds = extractPeriodFromSubscription(subscription);
        }

        if (!periodBounds) {
          console.warn(
            `Subscription missing period bounds for ${subscriptionId}; skipping update`
          );
          break;
        }

        const { start: currentPeriodStart, end: currentPeriodEnd } = periodBounds;
        const status = mapStripeStatusToSubscriptionStatus(subscription.status);

        await client.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: subscriptionId,
            plan: "PRO",
            period,
            status,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            plan: "PRO",
            period,
            status,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
          },
        });

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (!subscriptionId) {
          console.warn("invoice.payment_succeeded without subscription id");
          break;
        }

        const subRecord = await client.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (!subRecord) {
          console.warn("No subscription record for", subscriptionId);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const epoch = subscriptionPeriodEpoch(subscription);
        if (!epoch) {
          console.warn("invoice.payment_succeeded: missing period on subscription");
          break;
        }
        const currentPeriodStart = new Date(epoch.start * 1000);
        const currentPeriodEnd = new Date(epoch.end * 1000);
        const status = mapStripeStatusToSubscriptionStatus(subscription.status);

        const priceId = subscription.items.data[0]?.price.id;
        const period =
          priceId === process.env.STRIPE_ANNUAL_PRICE_ID ? "ANNUAL" : "MONTHLY";

        await client.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            period,
            status,
            startDate: currentPeriodStart,
            endDate: currentPeriodEnd,
          },
        });

        revalidatePath("/", "layout");
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripeSub(subscription);
        revalidatePath("/", "layout");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subRecord = await client.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!subRecord) {
          console.error("No subscription record on deletion for", subscription.id);
          break;
        }

        await client.subscription.delete({
          where: { stripeSubscriptionId: subscription.id },
        });

        revalidatePath("/", "layout");
        break;
      }

      default:
        break;
    }
  } catch (err: unknown) {
    console.error("Error handling webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
