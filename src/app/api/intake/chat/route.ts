import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { timingSafeEqual, createHash } from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID } from "@/lib/demo";
import { z } from "zod";

export const runtime = "nodejs";

const MODEL = "anthropic/claude-sonnet-4-5";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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

// Mirrors the bodySchema in src/app/api/intake/submit/route.ts (minus
// engagementId/token) — this is the actual bar a turn must clear before we
// tell the client the interview is "done", not just the model's say-so.
const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
});

const completionSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().min(1).email(),
  companyName: z.string().min(1),
  oneLiner: z.string().min(10).max(200),
  sector: z.string().min(1),
  stage: z.enum(["pre-seed", "seed", "series-a", "series-b+"]),
  problem: z.string().min(20),
  solution: z.string().min(20),
  marketSize: z.string().min(5),
  keyMetrics: z.string().min(5),
  growthRate: z.string().min(1),
  notableCustomers: z.string(),
  teamMembers: z.array(teamMemberSchema).min(1).max(6),
  currentRevenue: z.string().min(1),
  burnRate: z.string().min(1),
  runway: z.string().min(1),
  threeYearProjections: z.string().min(10),
  raiseAmount: z.string().min(1),
  valuationExpectation: z.string().min(1),
  // Floor matches the written form's allocation builder ("Sales: 100%"), so
  // form-seeded answers don't get re-asked in chat.
  useOfFunds: z.string().min(8),
  currentInvestors: z.string(),
});

const FIELD_SPEC = `
- clientName (string): the interviewee's name
- clientEmail (string, valid email): the interviewee's email
- companyName (string)
- oneLiner (string, 10-200 chars): one-sentence pitch
- sector (string): industry / category. If the founder's own description (one-liner, problem, solution) already makes this obvious, don't ask it as a blind open question — state your inference and ask them to confirm or correct it in one sentence.
- stage (one of: "pre-seed", "seed", "series-a", "series-b+")
- problem (string, 20+ chars): the pain being solved
- solution (string, 20+ chars): how the product solves it
- marketSize (string): TAM/SAM/SOM or similar
- keyMetrics (string, 5+ chars): traction numbers (ARR, customers, etc.)
- growthRate (string): a growth rate, ideally just a number like "15" meaning %/mo
- notableCustomers (string, can be empty): notable logos/customers
- teamMembers (array of {name, role, bio}, 1-6 entries, each field non-empty, bio should be a real sentence)
- currentRevenue (string): current ARR/revenue, numeric-ish
- burnRate (string): monthly burn, numeric-ish
- runway (string): months of runway, numeric-ish. If you need to calculate this yourself, use NET burn (monthly burn minus monthly revenue), not gross burn — cash in the bank divided by gross burn overstates how fast a company is running out of money when it has revenue coming in. Double-check any math before stating it as fact.
- threeYearProjections (string, 10+ chars): revenue projections narrative
- raiseAmount (string): how much they're raising
- valuationExpectation (string): target valuation
- useOfFunds (string, 20+ chars): how funds will be used
- currentInvestors (string, can be empty): existing investors
`;

const INTERVIEWER_PROMPT = `You are a friendly, sharp analyst conducting a live interview with a startup founder to gather everything needed for an investor-ready pitch deck. Ask ONE question at a time, conversationally — never list multiple questions in one message. Ask natural follow-ups when an answer is too short or vague to be usable in a pitch deck (e.g. a one-word answer for "the problem"), but don't be pedantic once you have something usable.

Before asking about a topic, re-read what the founder has already told you. If their prior answers already make the answer to the next topic obvious (e.g. they described AI hardware in detail, so the sector is clearly AI hardware), don't ask it as if from scratch — state your inference in one sentence and ask them to confirm or correct it. Never ask a question that ignores context you were just given.

Reply with plain conversational text only — no JSON, no markdown, no field names, no code fences. Just talk like a person.

You need to eventually cover all of these topics:
${FIELD_SPEC}

Cover them in a sensible order (intro/company basics → problem & market → traction → team → financials → the raise), but adapt based on what the founder volunteers.`;

const EXTRACTOR_PROMPT = `You extract structured data from an interview transcript between an analyst and a startup founder. You will be given the transcript and a JSON object of fields already known. Return ONLY a raw JSON object (no markdown, no code fences, no commentary) mapping any of these field names to values you can confidently determine from the WHOLE transcript so far:
${FIELD_SPEC}

Rules:
- Only include a field if the transcript actually supports a confident value. Omit fields you're unsure about rather than guessing.
- "stage" must be exactly one of: "pre-seed", "seed", "series-a", "series-b+".
- "sector" can be inferred from the founder's product/problem/solution description even if they never state an industry label explicitly — don't require a literal answer to a "what sector" question.
- "teamMembers" must be an array of objects: {"name": string, "role": string, "bio": string}.
- For narrative fields (problem, solution, marketSize, threeYearProjections, useOfFunds), write a clean 1-3 sentence summary in the founder's own words/numbers — don't just copy a one-word fragment.
- Merge with, don't contradict, the fields already known unless the founder corrected themselves.
- Return {} if nothing new can be confidently extracted.`;

type Role = "system" | "user" | "assistant";

async function callModel(
  messages: { role: Role; content: string }[],
  opts?: { json?: boolean }
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://pitchready.co",
      "X-Title": "Series A HUB",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text) throw new Error("No text content in OpenRouter response");
  return text;
}

function extractJsonObject(raw: string): string {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return stripped;
  return stripped.slice(start, end + 1);
}

function missingFields(collected: Record<string, unknown>): string[] {
  const result = completionSchema.safeParse(collected);
  if (result.success) return [];
  const fields = new Set<string>();
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) fields.add(String(issue.path[0]));
  }
  return Array.from(fields);
}

async function extractFields(
  history: { role: Role; content: string }[],
  collected: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const transcript = history.map((m) => `${m.role === "user" ? "Founder" : "Analyst"}: ${m.content}`).join("\n");
  const messages: { role: Role; content: string }[] = [
    { role: "system", content: EXTRACTOR_PROMPT },
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
    const storedToken: string = engagementData.intakeToken ?? "";
    const storedBuf = Buffer.from(createHash("sha256").update(storedToken).digest("hex"));
    const suppliedBuf = Buffer.from(createHash("sha256").update(token).digest("hex"));
    const tokenValid =
      storedBuf.length === suppliedBuf.length && timingSafeEqual(storedBuf, suppliedBuf);
    if (!tokenValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    if (engagementData.status !== "awaiting_intake") {
      return NextResponse.json({ error: "Intake already submitted" }, { status: 409 });
    }
  }

  // Extract structured fields from the whole conversation so far. This runs
  // every turn off the full transcript (not just the latest message), so a
  // flaky extraction on one turn gets a chance to be recovered on the next.
  const newlyExtracted = history.length > 0 ? await extractFields(history, collected) : {};
  const merged = { ...collected, ...newlyExtracted };

  const completion = completionSchema.safeParse(merged);
  const done = completion.success;
  const missing = done ? [] : missingFields(merged);

  const interviewerMessages: { role: Role; content: string }[] = [{ role: "system", content: INTERVIEWER_PROMPT }];

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

  const totalFields = Object.keys(completionSchema.shape).length;
  return NextResponse.json({
    message,
    collected: merged,
    done,
    finalData: done ? completion.data : undefined,
    progress: { covered: totalFields - missing.length, total: totalFields },
  });
}
