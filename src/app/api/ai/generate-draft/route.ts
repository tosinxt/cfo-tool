import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { generateDraft } from "@/lib/ai/generateDraft";
import { DraftGenerationError } from "@/lib/ai/types";
import type { Engagement } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Accept either an authenticated admin session cookie OR the internal CRON_SECRET,
  // which is used by server-to-server calls (e.g. intake/submit fire-and-forget trigger).
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal =
    internalSecret &&
    process.env.CRON_SECRET &&
    internalSecret === process.env.CRON_SECRET;

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

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement;

  if (!engagement.intake) {
    return NextResponse.json(
      { error: "Intake not submitted yet", code: "NO_INTAKE" },
      { status: 422 }
    );
  }

  // Idempotency: skip if already generated or currently in progress
  if (
    engagement.status === "drafting" ||
    engagement.status === "ready_for_review" ||
    engagement.status === "approved" ||
    engagement.status === "delivered"
  ) {
    return NextResponse.json({ success: true, skipped: true });
  }

  try {
    const draft = await generateDraft(engagement);

    await docRef.update({
      aiDraft: draft,
      status: "ready_for_review",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Fire-and-forget file generation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ engagementId });

    fetch(`${appUrl}/api/files/generate-pptx`, { method: "POST", headers, body }).catch(
      (err) => console.error(`[generate-draft] pptx trigger failed: ${engagementId}`, err)
    );
    fetch(`${appUrl}/api/files/generate-pdf`, { method: "POST", headers, body }).catch(
      (err) => console.error(`[generate-draft] pdf trigger failed: ${engagementId}`, err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const isDraftError = err instanceof DraftGenerationError;
    const code = isDraftError ? err.code : "UNKNOWN_ERROR";
    const message = (err as Error).message;

    Sentry.captureException(err, { extra: { engagementId, code } });
    console.error(`[generate-draft] failed for ${engagementId}: [${code}] ${message}`);

    await docRef
      .update({
        draftError: { code, message, failedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {});

    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}
