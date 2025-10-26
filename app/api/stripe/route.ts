import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
  const payload = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: payload.successUrl ?? 'https://example.com/success',
    cancel_url: payload.cancelUrl ?? 'https://example.com/cancel',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: payload.productName ?? 'Mission Credit Pack' },
          unit_amount: Number(payload.amount ?? 5000),
        },
        quantity: 1,
      },
    ],
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
