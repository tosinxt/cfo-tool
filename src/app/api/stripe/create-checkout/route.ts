import { NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID, DEMO_TOKEN } from "@/lib/demo";
import { adminDb } from "@/lib/firebase/admin";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

// TEMP: Stripe payment is disabled end-to-end until testing is finished.
// Flip this back to false (and re-enable the block below) to restore payment.
const FREE_MODE = true;

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (DEMO_MODE) {
    return NextResponse.json({
      url: `${appUrl}/intake/${DEMO_ENGAGEMENT_ID}?token=${DEMO_TOKEN}`,
    });
  }

  if (FREE_MODE) {
    const intakeToken = randomBytes(32).toString("hex");
    const docRef = adminDb.collection("engagements").doc();
    await docRef.set({
      id: docRef.id,
      clientEmail: "",
      clientName: "",
      status: "awaiting_intake",
      stripeSessionId: "free_mode",
      pricePaid: 0,
      intakeToken,
      paidAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      url: `${appUrl}/intake/${docRef.id}?token=${encodeURIComponent(intakeToken)}`,
    });
  }

  /*
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
  */
  return NextResponse.json({ error: "Payments disabled" }, { status: 503 });
}
