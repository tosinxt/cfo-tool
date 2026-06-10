import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

/** Updates deckUrl/reportUrl after a client-side Storage upload. */
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

  void actor; // checked; not needed for file URL updates

  const { id: engagementId } = params;
  let deckUrl: string | undefined;
  let deckPath: string | undefined;
  let reportUrl: string | undefined;
  let reportPath: string | undefined;
  try {
    const body = await req.json();
    deckUrl = body?.deckUrl;
    deckPath = body?.deckPath;
    reportUrl = body?.reportUrl;
    reportPath = body?.reportPath;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (deckUrl) updates["files.deckUrl"] = deckUrl;
  if (deckPath) updates["files.deckPath"] = deckPath;
  if (reportUrl) updates["files.reportUrl"] = reportUrl;
  if (reportPath) updates["files.reportPath"] = reportPath;

  await docRef.update(updates);

  return NextResponse.json({ ok: true });
}
