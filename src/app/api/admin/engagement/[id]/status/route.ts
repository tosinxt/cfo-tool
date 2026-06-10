import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import type { EngagementStatus, EngagementEventType } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_TRANSITIONS: EngagementStatus[] = ["approved", "delivered"];

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

  return NextResponse.json({ ok: true });
}
