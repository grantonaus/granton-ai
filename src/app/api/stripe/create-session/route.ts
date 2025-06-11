import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '../../../../../auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: NextRequest) {
    const userSession = await auth(); 
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: 'price_1RWOdQIwBfdKqFYHK268dJeX', quantity: 1 }], // your price ID
    success_url: 'http://localhost:3000/new-application',
    cancel_url: 'http://localhost:3000/new-application',
    metadata: {
        userId: userSession.user.id, // 👈 attaches your Prisma user ID
    },
  });

  return NextResponse.json({ url: session.url });
}
