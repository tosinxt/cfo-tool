import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { buildReport } from "@/lib/pdf/buildReport";
import type { Engagement } from "@/lib/types";
import type { AIDraft } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Accept either the internal CRON_SECRET (server-to-server from generate-draft)
  // or an authenticated admin session (the "Regenerate" button in the admin UI).
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal =
    internalSecret && process.env.CRON_SECRET && internalSecret === process.env.CRON_SECRET;

  if (!isInternal) {
    try {
      await verifyAdminForApi(req.headers.get("cookie"));
    } catch {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }
  }

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
    // No Cloud Storage dependency — the report is built fresh from aiDraft/cfoEdits
    // on every download instead of being persisted. This call just validates the
    // build succeeds (e.g. after a CFO edit) and surfaces errors early.
    await buildReport(draft, companyName);

    await docRef.update({
      "files.reportError": FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[generate-pdf] failed for ${engagementId}: ${message}`);
    Sentry.captureException(err, { tags: { route: "generate-pdf" }, extra: { engagementId } });
    await docRef
      .update({
        "files.reportError": { message, failedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {});
    return NextResponse.json({ error: message, code: "PDF_ERROR" }, { status: 500 });
  }
}
