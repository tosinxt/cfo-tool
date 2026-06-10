import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID, DEMO_TOKEN } from "@/lib/demo";

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (DEMO_MODE) {
    return NextResponse.json({
      url: `${appUrl}/intake/${DEMO_ENGAGEMENT_ID}?token=${DEMO_TOKEN}`,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "auto",
    customer_creation: "always",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Number(process.env.STRIPE_PRODUCT_PRICE_CENTS ?? 299700),
          product_data: {
            name: "Series A Pitch Deck",
            description:
              "A polished, investor-ready pitch deck delivered in 5–7 business days.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/`,
  });

  return NextResponse.json({ url: session.url });
}
