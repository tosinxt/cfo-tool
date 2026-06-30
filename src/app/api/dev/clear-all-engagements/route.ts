import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// Dev-only reset: wipes every engagement document. Used to clear out test
// data accumulated while exercising checkout/intake flows locally.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const snap = await adminDb.collection("engagements").get();
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));

  return NextResponse.json({ success: true, deleted: snap.docs.map((d) => d.id) });
}
