import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { checkRateLimit } from "@/lib/rateLimit";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";
import { QUESTIONS_BY_ID } from "@/lib/intake/bank";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID } from "@/lib/demo";
import {
  MAX_UPLOAD_BYTES,
  extractUploadText,
  kindFromFilename,
} from "@/lib/intake/parseUpload";
import { extractFieldsFromDocument } from "@/lib/intake/uploadExtract";
import type { Branch } from "@/lib/intake/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return fail("That file is too large. Please upload a file under 4 MB.", 413);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Invalid upload", 400);
  }

  const engagementId = form.get("engagementId");
  const token = form.get("token");
  const file = form.get("file");
  const branchField = form.get("branch");
  if (typeof engagementId !== "string" || !engagementId || typeof token !== "string" || !token) {
    return fail("Invalid request", 400);
  }
  if (!(file instanceof File)) return fail("No file attached", 400);
  const branch: Branch | null =
    branchField === "industrial" || branchField === "technology" ? branchField : null;

  const rl = await checkRateLimit(req, {
    key: "intake-upload",
    max: 10,
    window: 60 * 60 * 1000,
    identifier: engagementId,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads, please try again later." },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined }
    );
  }

  const kind = kindFromFilename(file.name);
  if (!kind) return fail("Unsupported file type. Please upload a PDF, PowerPoint (.pptx), CSV, or Markdown file.", 415);
  if (file.size > MAX_UPLOAD_BYTES) return fail("That file is too large. Please upload a file under 4 MB.", 413);
  if (file.size === 0) return fail("That file is empty.", 400);

  if (DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID) {
    return NextResponse.json({ ok: true, demo: true, filename: file.name, fields: {}, applied: [] });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return fail("Engagement not found", 404);
  const data = docSnap.data()!;
  if (!intakeTokenMatches(data.intakeToken, token)) return fail("Invalid token", 403);

  const submissionStatus = data.intakeV2?.submission_status;
  if (data.status !== "awaiting_intake" || (submissionStatus && submissionStatus !== "draft")) {
    return fail("This intake has already been submitted.", 409);
  }

  let text: string;
  try {
    text = await extractUploadText(kind, Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "We couldn't read that file.", 422);
  }
  if (!text) {
    return fail("We couldn't find any text in that file. If it's a scanned document, try a text-based export.", 422);
  }

  let fields;
  try {
    fields = await extractFieldsFromDocument(text, branch);
  } catch (err) {
    console.error("[intake/upload] extraction failed", err);
    Sentry.captureException(err, { extra: { engagementId } });
    return fail("We couldn't analyze that document. Please try again.", 502);
  }

  const existing = (data.intakeV2?.answers ?? {}) as Record<string, { value?: unknown }>;
  const isEmptyValue = (v: unknown) =>
    v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  const now = new Date().toISOString();
  const answers: Record<string, unknown> = {};
  const applied: string[] = [];
  for (const [id, value] of Object.entries(fields)) {
    if (!isEmptyValue(existing[id]?.value)) continue;
    const q = QUESTIONS_BY_ID[id];
    answers[id] = {
      question_id: q.id,
      section: q.section,
      branch: q.branch ?? branch ?? null,
      value,
      confidence: "estimate",
      attachments: [{ name: file.name, note: "Pre-filled from uploaded document" }],
      status: "answered",
      reviewer_note: null,
      updated_at: now,
    };
    applied.push(id);
  }

  const intakeV2: Record<string, unknown> = {
    submission_status: "draft",
    updatedAt: FieldValue.serverTimestamp(),
    answers,
  };
  if (!data.intakeV2) intakeV2.deck_version = 0;
  const extractedBranch = fields.industry_branch;
  if (!data.intakeV2?.industry_branch && (extractedBranch === "industrial" || extractedBranch === "technology")) {
    intakeV2.industry_branch = extractedBranch;
  }

  await docRef.collection("uploads").add({
    filename: file.name,
    kind,
    size: file.size,
    text,
    extractedFields: fields,
    appliedFields: applied,
    createdAt: FieldValue.serverTimestamp(),
  });
  await docRef.set({ intakeV2, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  await appendEvent(
    engagementId,
    "intake_document_uploaded",
    null,
    data.clientEmail ?? null,
    `Client uploaded ${file.name}`,
    { kind, extracted: Object.keys(fields).length, applied: applied.length }
  ).catch(() => {});

  return NextResponse.json({ ok: true, filename: file.name, fields, applied });
}
