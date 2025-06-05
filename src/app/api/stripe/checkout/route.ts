// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { client as prisma } from "@/lib/prisma";
import { auth } from "../../../../../auth";

// Replace this with the Price ID from your Stripe Dashboard for Granton+
const PRICE_ID = "price_1RWOdQIwBfdKqFYHK268dJeX";

export const runtime = "nodejs"; // so we can use Prisma

export async function POST(req: NextRequest) {
  // 1) Ensure this is a logged-in user (NextAuth)

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, stripeCustomerId: true },
  });
  if (!dbUser) {
    return NextResponse.json(
      { error: "User record not found." },
      { status: 400 }
    );
  }

  let stripeCustomerId = dbUser.stripeCustomerId;

  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        metadata: { userId: dbUser.id },
      });
      stripeCustomerId = customer.id;

      // Save it back to Prisma so next time we re-use it
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId },
      });
    } catch (err: any) {
      console.error("[Stripe Checkout] Error creating customer:", err);
      return NextResponse.json(
        { error: "Failed to create Stripe customer." },
        { status: 500 }
      );
    }
  }

  // 4) Create a one-time Checkout Session
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment", // one-time payment
      metadata: {
        userId: dbUser.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err: any) {
    console.error("[Stripe Checkout] Error creating session:", err);
    return NextResponse.json(
      { error: "Unable to create Checkout Session." },
      { status: 500 }
    );
  }
}
