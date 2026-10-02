import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminDb } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID } from "@/lib/demo";
import { MAX_UPLOAD_BYTES, extractUploadText, kindFromFilename } from "@/lib/intake/parseUpload";

export const runtime = "nodejs";
export const maxDuration = 60;

// Matches the chat route's per-message cap, since the transcript is sent on as a chat turn.
const MAX_TRANSCRIPT_CHARS = 4000;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Transcribes a voice note recorded in the intake chat. Nothing is saved here —
 *  the transcript is posted back to /api/intake/chat as the founder's message. */
export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return fail("That voice note is too long. Please keep it under 5 minutes.", 413);
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
  if (typeof engagementId !== "string" || !engagementId || typeof token !== "string" || !token) {
    return fail("Invalid request", 400);
  }
  if (!(file instanceof File)) return fail("No voice note attached", 400);

  const rl = await checkRateLimit(req, {
    key: "intake-transcribe",
    max: 60,
    window: 60 * 60 * 1000,
    identifier: engagementId,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many voice notes, please try again later." },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined }
    );
  }

  if (kindFromFilename(file.name) !== "audio") return fail("Unsupported audio format.", 415);
  if (file.size > MAX_UPLOAD_BYTES) return fail("That voice note is too long. Please keep it under 5 minutes.", 413);
  if (file.size === 0) return fail("That voice note is empty.", 400);

  if (!(DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID)) {
    const docSnap = await adminDb.collection("engagements").doc(engagementId).get();
    if (!docSnap.exists) return fail("Engagement not found", 404);
    const data = docSnap.data()!;
    if (!intakeTokenMatches(data.intakeToken, token)) return fail("Invalid token", 403);
    if (data.status !== "awaiting_intake") return fail("Intake already submitted", 409);
  }

  let text: string;
  try {
    text = await extractUploadText("audio", Buffer.from(await file.arrayBuffer()), file.name);
  } catch (err) {
    Sentry.captureException(err, { extra: { engagementId } });
    return fail(err instanceof Error ? err.message : "We couldn't transcribe that voice note.", 502);
  }
  if (!text) return fail("We couldn't hear any speech in that voice note.", 422);

  return NextResponse.json({ text: text.slice(0, MAX_TRANSCRIPT_CHARS) });
}
