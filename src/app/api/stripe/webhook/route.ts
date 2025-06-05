// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { client as prisma } from "@/lib/prisma";
import Stripe from "stripe";

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment");
}
export const runtime = "nodejs";

export const config = {
  api: { bodyParser: false }, // Stripe requires raw body for signature
};

/** Helper to buffer the request stream */
async function buffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature") || "";
  const buf = await buffer(req.body as unknown as NodeJS.ReadableStream);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Only respond to completed checkout sessions (one-time payments)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId as string | undefined;

    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            hasPaid: true,
            paidAt: new Date(),
          },
        });
        console.log(`[stripe-webhook] Marked user ${userId} as paid.`);
      } catch (dbErr) {
        console.error(`[stripe-webhook] Error updating user ${userId}:`, dbErr);
        // We return 200 anyway so Stripe doesn’t endlessly retry. In production,
        // you’d set up an alert/monitor if DB updates fail repeatedly.
      }
    } else {
      console.warn("[stripe-webhook] checkout.session.completed had no metadata.userId");
    }
  }

  // Always respond with 200 to tell Stripe we got it
  return NextResponse.json({ received: true }, { status: 200 });
}
