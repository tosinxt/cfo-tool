import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminDb } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID } from "@/lib/demo";
import { z } from "zod";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";
import { completionGateSchema } from "@/lib/intake/schema";
import { buildInterviewerPrompt, buildExtractorPrompt } from "@/lib/intake/chatSpec";
import { callModel, extractJsonObject, type Role } from "@/lib/intake/llm";
import type { Branch } from "@/lib/intake/types";

/** The branch the founder has declared so far, if any. */
function branchOf(collected: Record<string, unknown>): Branch | null {
  const v = collected.industry_branch;
  return v === "industrial" || v === "technology" ? v : null;
}

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  engagementId: z.string().min(1),
  token: z.string().min(1),
  history: z.array(messageSchema).max(60),
  collected: z.record(z.string(), z.unknown()).default({}),
});

function missingFields(collected: Record<string, unknown>, branch: Branch | null): string[] {
  const result = completionGateSchema({ branch }).safeParse(collected);
  if (result.success) return [];
  const fields = new Set<string>();
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) fields.add(String(issue.path[0]));
  }
  return Array.from(fields);
}

async function extractFields(
  history: { role: Role; content: string }[],
  collected: Record<string, unknown>,
  branch: Branch | null
): Promise<Record<string, unknown>> {
  const transcript = history.map((m) => `${m.role === "user" ? "Founder" : "Analyst"}: ${m.content}`).join("\n");
  const messages: { role: Role; content: string }[] = [
    { role: "system", content: buildExtractorPrompt(branch) },
    {
      role: "user",
      content: `Fields already known (JSON): ${JSON.stringify(collected)}\n\nTranscript:\n${transcript}`,
    },
  ];

  try {
    const raw = await callModel(messages, { json: true });
    const parsed = JSON.parse(extractJsonObject(raw));
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch (err) {
    console.warn("[intake/chat] extraction call failed or returned non-JSON, keeping prior fields:", err);
    return {};
  }
}

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(req, { key: "intake-chat", max: 120, window: 60 * 60 * 1000 });
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { engagementId, token, history, collected } = parsed.data;

  if (!(DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID)) {
    const docSnap = await adminDb.collection("engagements").doc(engagementId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
    }
    const engagementData = docSnap.data()!;
    if (!intakeTokenMatches(engagementData.intakeToken, token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    if (engagementData.status !== "awaiting_intake") {
      return NextResponse.json({ error: "Intake already submitted" }, { status: 409 });
    }
  }

  // Extract structured fields from the whole conversation so far. This runs
  // every turn off the full transcript (not just the latest message), so a
  // flaky extraction on one turn gets a chance to be recovered on the next.
  const priorBranch = branchOf(collected);
  const newlyExtracted =
    history.length > 0 ? await extractFields(history, collected, priorBranch) : {};
  const merged = { ...collected, ...newlyExtracted };
  const branch = branchOf(merged);

  const gate = completionGateSchema({ branch });
  const completion = gate.safeParse(merged);
  const done = completion.success;
  const missing = done ? [] : missingFields(merged, branch);

  const interviewerMessages: { role: Role; content: string }[] = [
    { role: "system", content: buildInterviewerPrompt(branch) },
  ];

  if (done) {
    interviewerMessages.push({
      role: "system",
      content: "Every field needed for the pitch deck has now been gathered. Do not ask another question — write a short, warm closing line telling the founder their answers are being put together into a draft.",
    });
  } else {
    if (missing.length > 0) {
      interviewerMessages.push({
        role: "system",
        content: `Topics still missing or incomplete, in no particular order: ${missing.join(", ")}. Ask about ONE of these next — whichever flows most naturally from the conversation.`,
      });
    }
  }

  interviewerMessages.push(...history);
  if (history.length === 0) {
    interviewerMessages.push({ role: "user", content: "[Begin the interview with your opening question.]" });
  }

  let message: string;
  try {
    message = (await callModel(interviewerMessages)).trim();
  } catch (err) {
    console.error("[intake/chat] interviewer call failed", err);
    Sentry.captureException(err, { extra: { engagementId } });
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  // Only REQUIRED questions are in the gate, and every branch follow-up is
  // optional — so this total stays constant when the founder picks a branch
  // mid-interview and the progress bar never jumps backwards.
  const totalFields = Object.keys(gate.shape).length;
  return NextResponse.json({
    message,
    collected: merged,
    done,
    finalData: done ? completion.data : undefined,
    progress: { covered: totalFields - missing.length, total: totalFields },
  });
}
