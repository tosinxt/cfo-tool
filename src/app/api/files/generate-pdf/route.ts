import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { buildReport } from "@/lib/pdf/buildReport";
import type { Engagement } from "@/lib/types";
import type { AIDraft } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let engagementId: string | undefined;

  try {
    const body = await req.json();
    engagementId = body?.engagementId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "INVALID_JSON" }, { status: 400 });
  }

  if (!engagementId || typeof engagementId !== "string") {
    return NextResponse.json(
      { error: "engagementId is required", code: "MISSING_ENGAGEMENT_ID" },
      { status: 400 }
    );
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return NextResponse.json({ error: "Engagement not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement & {
    aiDraft?: AIDraft;
  };

  if (!engagement.aiDraft) {
    return NextResponse.json(
      { error: "AI draft not yet generated", code: "NO_DRAFT" },
      { status: 422 }
    );
  }

  // CFO edits take precedence over the raw AI draft
  const draft: AIDraft = {
    ...engagement.aiDraft,
    reportSections:
      engagement.cfoEdits?.reportSections ?? engagement.aiDraft.reportSections,
    deckOutline:
      engagement.cfoEdits?.deckOutline ?? engagement.aiDraft.deckOutline,
  };

  const companyName =
    engagement.intake?.companyName ?? engagement.clientName ?? "Company";

  try {
    const pdfBuffer = await buildReport(draft, companyName);

    const version = (engagement.files?.reportVersion ?? 0) + 1;
    const storagePath = `engagements/${engagementId}/report_v${version}.pdf`;

    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: { engagementId, version: String(version) },
      },
    });

    await docRef.update({
      "files.reportPath": storagePath,
      "files.reportVersion": version,
      "files.reportUrl": FieldValue.delete(), // served via /api/admin/.../download, not a public URL
      "files.reportError": FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[generate-pdf] failed for ${engagementId}: ${message}`);
    await docRef
      .update({
        "files.reportError": { message, failedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {});
    return NextResponse.json({ error: message, code: "PDF_ERROR" }, { status: 500 });
  }
}
