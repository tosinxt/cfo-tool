import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase/admin";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "stripe-webhook" } });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const intakeToken = randomBytes(32).toString("hex");
    const clientEmail =
      session.customer_details?.email ?? session.customer_email ?? "";
    const pricePaid = session.amount_total ?? 0;

    const docRef = adminDb.collection("engagements").doc();
    await docRef.set({
      id: docRef.id,
      clientEmail,
      clientName: session.customer_details?.name ?? "",
      status: "awaiting_intake",
      stripeSessionId: session.id,
      pricePaid,
      intakeToken,
      paidAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ received: true });
}
