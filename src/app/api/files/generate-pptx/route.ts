import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { buildDeck } from "@/lib/pptx/buildDeck";
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
    deckOutline:
      engagement.cfoEdits?.deckOutline ?? engagement.aiDraft.deckOutline,
    reportSections:
      engagement.cfoEdits?.reportSections ?? engagement.aiDraft.reportSections,
  };

  const companyName =
    engagement.intake?.companyName ?? engagement.clientName ?? "Company";

  try {
    const pptxBuffer = await buildDeck(draft, companyName);

    const version = (engagement.files?.deckVersion ?? 0) + 1;
    const storagePath = `engagements/${engagementId}/deck_v${version}.pptx`;

    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    await file.save(pptxBuffer, {
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        metadata: { engagementId, version: String(version) },
      },
    });

    await docRef.update({
      "files.deckPath": storagePath,
      "files.deckVersion": version,
      "files.deckUrl": FieldValue.delete(), // served via /api/admin/.../download, not a public URL
      "files.deckError": FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[generate-pptx] failed for ${engagementId}: ${message}`);
    await docRef
      .update({
        "files.deckError": { message, failedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {});
    return NextResponse.json({ error: message, code: "PPTX_ERROR" }, { status: 500 });
  }
}
