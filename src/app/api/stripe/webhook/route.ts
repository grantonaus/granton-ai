// // app/api/stripe/webhook/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// import { client as prisma } from "@/lib/prisma";
// import Stripe from "stripe";

// if (!process.env.STRIPE_WEBHOOK_SECRET) {
//   throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment");
// }
// export const runtime = "nodejs";

// export const config = {
//   api: { bodyParser: false }, // Stripe requires raw body for signature
// };


// export async function POST(req: NextRequest) {
//   const signature = req.headers.get("stripe-signature") || "";
//   const buf = await buffer(req.body as unknown as NodeJS.ReadableStream);

//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       buf,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET as string
//     );
//   } catch (err: any) {
//     console.error("[stripe-webhook] Signature verification failed:", err.message);
//     return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
//   }

//   // Only respond to completed checkout sessions (one-time payments)
//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object as Stripe.Checkout.Session;
//     const userId = session.metadata?.userId as string | undefined;

//     if (userId) {
//       try {
//         await prisma.user.update({
//           where: { id: userId },
//           data: {
//             hasPaid: true,
//             paidAt: new Date(),
//           },
//         });
//         console.log(`[stripe-webhook] Marked user ${userId} as paid.`);
//       } catch (dbErr) {
//         console.error(`[stripe-webhook] Error updating user ${userId}:`, dbErr);
//         // We return 200 anyway so Stripe doesn’t endlessly retry. In production,
//         // you’d set up an alert/monitor if DB updates fail repeatedly.
//       }
//     } else {
//       console.warn("[stripe-webhook] checkout.session.completed had no metadata.userId");
//     }
//   }

//   // Always respond with 200 to tell Stripe we got it
//   return NextResponse.json({ received: true }, { status: 200 });
// }



// app/api/webhooks/stripe/route.ts
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
    console.log("Event: ", event)
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 4) Handle the event types you care about
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
      
        const userId = session.metadata?.userId;
      
        if (!userId) {
          console.error('⚠️ No userId in metadata');
          return NextResponse.json({ received: true });
        }
      
        await client.user.update({
          where: { id: userId },
          data: { hasPaid: true },
        });
      
        console.log(`✅ Marked user ${userId} as paid`);
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
