import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import { sendDeckReady } from "@/lib/email";
import { DEMO_MODE } from "@/lib/demo";
import type { EngagementStatus, EngagementEventType } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_TRANSITIONS: EngagementStatus[] = ["approved", "delivered"];

// A deck may only be delivered after it has been approved — otherwise an
// unreviewed draft could be released to the customer in a single step.
const REQUIRED_FROM: Partial<Record<EngagementStatus, EngagementStatus[]>> = {
  approved: ["ready_for_review", "approved"],
  delivered: ["approved", "delivered"],
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let actor: { uid: string; email: string };
  try {
    actor = await verifyAdminForApi(req.headers.get("cookie"));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: engagementId } = params;
  let status: EngagementStatus;
  try {
    const body = await req.json();
    status = body?.status;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!ALLOWED_TRANSITIONS.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_TRANSITIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentStatus = docSnap.data()!.status as EngagementStatus;
  const allowedFrom = REQUIRED_FROM[status];
  if (allowedFrom && !allowedFrom.includes(currentStatus)) {
    return NextResponse.json(
      { error: `Cannot move from ${currentStatus} to ${status}. Requires: ${allowedFrom.join(" or ")}.` },
      { status: 409 }
    );
  }

  await docRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const eventType: EngagementEventType = status === "approved" ? "approved" : "delivered";
  await appendEvent(
    engagementId,
    eventType,
    actor.uid,
    actor.email,
    `Engagement marked as ${status}`
  );

  // The intake confirmation promises "we'll email you when your deck is
  // ready" — delivered is that moment. Email failure must not fail the
  // status change.
  if (status === "delivered" && !DEMO_MODE) {
    const data = docSnap.data()!;
    if (data.clientEmail && data.intakeToken) {
      try {
        await sendDeckReady(data.clientEmail, engagementId, data.intakeToken, data.intake?.companyName);
      } catch (err) {
        console.error("[admin/status] deck-ready email failed", err);
      }
    } else {
      console.warn(`[admin/status] ${engagementId} delivered but missing clientEmail/intakeToken — no email sent`);
    }
  }

  return NextResponse.json({ ok: true });
}
