import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import type { ReportSection } from "@/lib/ai/types";

export const runtime = "nodejs";

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
  let reportSections: ReportSection[];
  try {
    const body = await req.json();
    reportSections = body?.reportSections;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(reportSections)) {
    return NextResponse.json({ error: "reportSections array required" }, { status: 400 });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await docRef.update({
    "cfoEdits.reportSections": reportSections,
    "cfoEdits.editedBy": actor.email,
    "cfoEdits.editedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendEvent(
    engagementId,
    "report_edit",
    actor.uid,
    actor.email,
    "Admin saved report edits",
    { sectionCount: reportSections.length }
  );

  return NextResponse.json({ ok: true });
}
