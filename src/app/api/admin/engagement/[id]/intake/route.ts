import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import { submissionSchema } from "@/lib/intake/schema";
import { QUESTIONS_BY_ID } from "@/lib/intake/bank";
import { getIntakeAnswers } from "@/lib/intake/answers";
import type { AnswerValue, Branch, Confidence } from "@/lib/intake/types";
import type { Engagement } from "@/lib/types";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  confidence: z.record(z.string(), z.enum(["confirmed", "estimate", "unknown"])).default({}),
  fieldsChanged: z.array(z.string()).default([]),
  industry_branch: z.enum(["industrial", "technology"]).optional(),
});

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
  let parsedBody: z.infer<typeof bodySchema>;
  try {
    parsedBody = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement;
  const existing = getIntakeAnswers(engagement);
  const branch = (parsedBody.industry_branch ??
    existing?.industry_branch ??
    "technology") as Branch;

  // Admin edits are loose: Brent routinely saves a partially-filled intake
  // while chasing the founder for the rest.
  const parsed = submissionSchema({ branch, loose: true }).safeParse(parsedBody.answers);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid intake data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  // Per-answer dotted paths, so editing one field cannot drop the others or
  // clobber intakeV2.submittedAt the way the old whole-object overwrite did.
  const update: Record<string, unknown> = {
    "intakeV2.industry_branch": branch,
    "intakeV2.updatedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  for (const [id, value] of Object.entries(parsed.data)) {
    const q = QUESTIONS_BY_ID[id];
    if (!q || value === undefined) continue;
    const prior = existing?.answers?.[id];
    const isEmpty = value === "" || (Array.isArray(value) && value.length === 0);
    const conf: Confidence =
      parsedBody.confidence[id] ?? prior?.confidence ?? "confirmed";
    update[`intakeV2.answers.${id}`] = {
      question_id: q.id,
      section: q.section,
      branch: q.branch ?? branch,
      value: value as AnswerValue,
      confidence: conf,
      attachments: prior?.attachments ?? [],
      status: isEmpty ? "skipped" : "answered",
      reviewer_note: prior?.reviewer_note ?? null,
      updated_at: now,
    };
  }

  await docRef.update(update);

  await appendEvent(
    engagementId,
    "intake_edit",
    actor.uid,
    actor.email,
    "Admin edited intake answers",
    { fieldsChanged: parsedBody.fieldsChanged }
  );

  return NextResponse.json({ ok: true });
}
