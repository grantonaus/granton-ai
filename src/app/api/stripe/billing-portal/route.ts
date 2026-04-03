import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "@/lib/auth-server";
import { client } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

/**
 * POST /api/stripe/billing-portal
 * Opens Stripe Customer Portal — update payment method, switch plan (if configured in Dashboard),
 * cancel at period end, and view invoices.
 *
 * Configure the portal (use the same mode as STRIPE_SECRET_KEY — test vs live):
 *   Test:  https://dashboard.stripe.com/test/settings/billing/portal
 *   Live:  https://dashboard.stripe.com/settings/billing/portal
 *
 * Optional: set STRIPE_BILLING_PORTAL_CONFIGURATION_ID if you use a non-default portal
 * (Dashboard → Customer portal → open your configuration → ID starts with bpc_).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await client.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe customer on file. Complete a subscription checkout first.",
        },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const portalConfigurationId =
      process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/grant-database`,
      ...(portalConfigurationId
        ? { configuration: portalConfigurationId }
        : {}),
    });

    if (!portalSession.url) {
      return NextResponse.json(
        { error: "Failed to create billing portal session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("billing portal:", error);
    const message =
      error instanceof Error ? error.message : "Failed to open billing portal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
