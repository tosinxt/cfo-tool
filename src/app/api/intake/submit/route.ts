import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendClientConfirmation, sendAdminNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";
import { DEMO_MODE } from "@/lib/demo";
import { submissionSchema } from "@/lib/intake/schema";
import { QUESTIONS_BY_ID } from "@/lib/intake/bank";
import { appendEvent } from "@/lib/firebase/appendEvent";
import type { AnswerMap, AnswerValue, Branch, Confidence } from "@/lib/intake/types";
import { z } from "zod";

export const runtime = "nodejs";

// The branch has to be known before the answer schema can be built, so the
// envelope is parsed first and the answers are validated in a second pass.
const envelopeSchema = z.object({
  engagementId: z.string().min(1),
  token: z.string().min(1),
  business_type: z.enum(["b2b", "b2c", "other"]),
  industry_branch: z.enum(["industrial", "technology"]),
  answers: z.record(z.string(), z.unknown()),
  confidence: z.record(z.string(), z.enum(["confirmed", "estimate", "unknown"])).default({}),
});

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(req, { key: "intake-submit" });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 3600) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const envelope = envelopeSchema.safeParse(body);
  if (!envelope.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: envelope.error.flatten() },
      { status: 400 }
    );
  }

  const {
    engagementId,
    token,
    business_type,
    industry_branch,
    answers: rawAnswers,
    confidence,
  } = envelope.data;

  if (business_type !== "b2b") {
    return NextResponse.json(
      { error: "Only B2B companies are supported in this version." },
      { status: 400 }
    );
  }

  const branch = industry_branch as Branch;
  const parsedAnswers = submissionSchema({ branch }).safeParse(rawAnswers);
  if (!parsedAnswers.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsedAnswers.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const answers: AnswerMap = {};
  for (const [id, value] of Object.entries(parsedAnswers.data)) {
    const q = QUESTIONS_BY_ID[id];
    if (!q || value === undefined) continue;
    const isEmpty = value === "" || (Array.isArray(value) && value.length === 0);
    const conf: Confidence = confidence[id] ?? "confirmed";
    answers[id] = {
      question_id: q.id,
      section: q.section,
      branch: q.branch ?? branch,
      value: value as AnswerValue,
      confidence: conf,
      attachments: [],
      status: isEmpty || conf === "unknown" ? "skipped" : "answered",
      reviewer_note: null,
      updated_at: now,
    };
  }

  // Demo mode: skip all Firebase/email/AI work
  if (DEMO_MODE) {
    void token;
    return NextResponse.json({ success: true });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  const engagementData = docSnap.data()!;

  if (!intakeTokenMatches(engagementData.intakeToken, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Idempotency guard
  if (engagementData.status !== "awaiting_intake") {
    return NextResponse.json({ success: true, alreadySubmitted: true });
  }

  // Identity lives in the question bank like every other answer, so there is
  // one source of truth for both intake surfaces.
  const clientName = String(parsedAnswers.data.client_name ?? "");
  const clientEmail = String(parsedAnswers.data.client_email ?? "");
  const companyName =
    typeof parsedAnswers.data.company_name === "string"
      ? parsedAnswers.data.company_name
      : clientName;

  await docRef.update({
    // The free-checkout path leaves these blank at engagement creation (no Stripe
    // checkout to collect them from), so the intake form is the source of truth here.
    clientName,
    clientEmail,
    intakeV2: {
      business_type,
      industry_branch: branch,
      submission_status: "submitted",
      deck_version: 0,
      answers,
      updatedAt: FieldValue.serverTimestamp(),
      submittedAt: FieldValue.serverTimestamp(),
    },
    status: "drafting",
    intakeSubmittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendEvent(
    engagementId,
    "intake_submitted",
    null,
    clientEmail,
    `Intake submitted (${branch})`,
    { branch, answered: Object.keys(answers).length }
  ).catch(() => {});

  // Fire emails — don't fail the request if they error
  await Promise.allSettled([
    sendClientConfirmation(clientEmail, engagementId),
    sendAdminNotification(engagementId, companyName),
  ]);

  // Fire-and-forget AI draft generation
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  fetch(`${appUrl}/api/ai/generate-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.CRON_SECRET ?? "",
    },
    body: JSON.stringify({ engagementId }),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
