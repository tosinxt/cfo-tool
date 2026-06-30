import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// Deletes engagements created by /api/dev/seed-drafts (identified by the
// "seed_dev" marker that route stamps on stripeSessionId), so stuck/stale
// dev test data doesn't linger in the admin queue.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const snap = await adminDb.collection("engagements").where("stripeSessionId", "==", "seed_dev").get();
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));

  return NextResponse.json({ success: true, deleted: snap.docs.map((d) => d.id) });
}
