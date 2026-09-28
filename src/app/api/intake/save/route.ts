import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rateLimit";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { QUESTIONS_BY_ID } from "@/lib/intake/bank";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID } from "@/lib/demo";

export const runtime = "nodejs";

const answerPatchSchema = z.object({
  // Drafts are incomplete by definition, so a patch is never validated against
  // the question's own min-length rules — that happens at submit.
  value: z.union([z.string(), z.array(z.string()), z.array(z.record(z.string(), z.unknown()))]),
  confidence: z.enum(["confirmed", "estimate", "unknown"]).optional(),
});

const bodySchema = z.object({
  engagementId: z.string().min(1),
  token: z.string().min(1),
  business_type: z.enum(["b2b", "b2c", "other"]).optional(),
  industry_branch: z.enum(["industrial", "technology"]).nullable().optional(),
  patch: z.record(z.string(), answerPatchSchema).default({}),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", details: (err as z.ZodError).issues ?? undefined },
      { status: 400 }
    );
  }

  const { engagementId, token, patch } = body;

  // Keyed on the engagement, not the IP — several founders behind one office
  // NAT must not share an autosave budget.
  const rl = await checkRateLimit(req, {
    key: "intake-save",
    max: 240,
    window: 60 * 60 * 1000,
    identifier: engagementId,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many saves, slow down." },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined }
    );
  }

  if (DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  const data = docSnap.data()!;
  if (!intakeTokenMatches(data.intakeToken, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Drafts are only writable before submission. Post-submit editing is a
  // separate, reviewer-notified flow (Phase 2) and must not ride on this route.
  const submissionStatus = data.intakeV2?.submission_status;
  if (data.status !== "awaiting_intake" || (submissionStatus && submissionStatus !== "draft")) {
    return NextResponse.json(
      { error: "This intake has already been submitted." },
      { status: 409 }
    );
  }

  const isFirstSave = !data.intakeV2;

  // Dotted paths so two open tabs merge per-answer instead of clobbering each
  // other's whole answer map.
  const update: Record<string, unknown> = {
    "intakeV2.submission_status": "draft",
    "intakeV2.updatedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isFirstSave) {
    update["intakeV2.deck_version"] = 0;
    update["intakeV2.answers"] = {};
  }
  if (body.business_type) update["intakeV2.business_type"] = body.business_type;
  if (body.industry_branch !== undefined) {
    update["intakeV2.industry_branch"] = body.industry_branch;
  }

  const now = new Date().toISOString();
  let written = 0;
  for (const [questionId, incoming] of Object.entries(patch)) {
    const q = QUESTIONS_BY_ID[questionId];
    if (!q) continue; // ignore ids that aren't in the bank
    const value = incoming.value;
    const isEmpty = value === "" || (Array.isArray(value) && value.length === 0);
    update[`intakeV2.answers.${questionId}`] = {
      question_id: q.id,
      section: q.section,
      branch: q.branch ?? body.industry_branch ?? null,
      value,
      confidence: incoming.confidence ?? "confirmed",
      attachments: [],
      status: isEmpty ? "skipped" : "answered",
      reviewer_note: null,
      updated_at: now,
    };
    written += 1;
  }

  // The first save must not land after the answers map is reset in the same
  // update — Firestore rejects overlapping field paths, so seed it separately.
  if (isFirstSave && written > 0) {
    delete update["intakeV2.answers"];
    await docRef.set({ intakeV2: { answers: {} } }, { merge: true });
  }

  await docRef.update(update);

  if (isFirstSave) {
    await appendEvent(
      engagementId,
      "intake_draft_started",
      null,
      data.clientEmail ?? null,
      "Client started filling in the intake"
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, saved: written });
}
