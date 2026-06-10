import * as Sentry from "@sentry/nextjs";
import { CFO_SYSTEM_PROMPT } from "./cfoSkill";
import { fetchCfoAddendum } from "./fetchCfoAddendum";
import { AIDraft, DraftGenerationError } from "./types";
import type { Engagement } from "@/lib/types";

const MODEL = "anthropic/claude-sonnet-4-5";
const MAX_TOKENS = 8000;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildUserPrompt(engagement: Engagement): string {
  const { intake, clientName, clientEmail } = engagement;
  if (!intake) throw new DraftGenerationError("No intake data found", "NO_INTAKE", engagement.id);

  const team = intake.teamMembers
    .map((m) => `  - ${m.name} (${m.role}): ${m.bio}`)
    .join("\n");

  return `Generate a Series A pitch deck outline and investor report for the following company.

CLIENT INFORMATION
Name: ${clientName}
Email: ${clientEmail}

COMPANY BASICS
Company Name: ${intake.companyName}
One-Liner: ${intake.oneLiner}
Sector: ${intake.sector}
Stage: ${intake.stage}

PROBLEM / SOLUTION / MARKET
Problem: ${intake.problem}
Solution: ${intake.solution}
Market Size: ${intake.marketSize}

TRACTION & KEY METRICS
Key Metrics: ${intake.keyMetrics}
Growth Rate: ${intake.growthRate}
Notable Customers / Logos: ${intake.notableCustomers || "Not provided"}

TEAM
${team}

FINANCIALS
Current Revenue: ${intake.currentRevenue}
Monthly Burn Rate: ${intake.burnRate}
Runway: ${intake.runway}
3-Year Projections: ${intake.threeYearProjections}

THE RAISE
Raise Amount: ${intake.raiseAmount}
Valuation Expectation: ${intake.valuationExpectation}
Use of Funds: ${intake.useOfFunds}
Current Investors: ${intake.currentInvestors || "None / not disclosed"}

Apply your full CFO and fundraising expertise. Where founder-provided data is weak, vague, or missing, note it explicitly in the relevant speakerNotes and suggest what the founder must prepare for investor diligence. Return only valid JSON as instructed.`;
}

async function callOpenRouter(
  userPrompt: string,
  cfoAddendum: string,
  strict = false
): Promise<string> {
  const customSection = cfoAddendum
    ? `\n\n## CFO PROPRIETARY METHODOLOGY NOTES\n\n${cfoAddendum}`
    : "";

  const strictSection = strict
    ? "\n\nCRITICAL: Your previous response contained invalid JSON. Return ONLY a raw JSON object. No explanation, no markdown, no code fences. Start with { and end with }."
    : "";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://pitchready.co",
      "X-Title": "PitchReady",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: CFO_SYSTEM_PROMPT + customSection + strictSection,
        },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text) {
    throw new Error("No text content in OpenRouter response");
  }
  return text;
}

function parseAIDraft(raw: string): AIDraft {
  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned) as AIDraft;

  if (!Array.isArray(parsed.deckOutline) || !Array.isArray(parsed.reportSections)) {
    throw new Error("Response missing deckOutline or reportSections arrays");
  }

  return parsed;
}

export async function generateDraft(engagement: Engagement): Promise<AIDraft> {
  const userPrompt = buildUserPrompt(engagement);
  const cfoAddendum = await fetchCfoAddendum();

  if (!cfoAddendum && process.env.NODE_ENV === "production") {
    const msg = `[generateDraft] CFO addendum is empty for engagement ${engagement.id} — proprietary methodology will not be applied.`;
    console.warn(msg);
    Sentry.captureMessage(msg, { level: "warning", extra: { engagementId: engagement.id } });
  }

  let raw: string;
  try {
    raw = await callOpenRouter(userPrompt, cfoAddendum, false);
  } catch (err) {
    throw new DraftGenerationError(
      `Claude API call failed: ${(err as Error).message}`,
      "OPENROUTER_API_ERROR",
      engagement.id
    );
  }

  try {
    return parseAIDraft(raw);
  } catch {
    // Retry once with stricter prompt
    console.error(`[generateDraft] JSON parse failed for ${engagement.id}, retrying with stricter prompt`);
    let retryRaw: string;
    try {
      retryRaw = await callOpenRouter(userPrompt, cfoAddendum, true);
    } catch (err) {
      throw new DraftGenerationError(
        `Claude API retry failed: ${(err as Error).message}`,
        "OPENROUTER_RETRY_ERROR",
        engagement.id
      );
    }

    try {
      return parseAIDraft(retryRaw);
    } catch (err) {
      throw new DraftGenerationError(
        `Malformed JSON after retry: ${(err as Error).message}`,
        "MALFORMED_JSON",
        engagement.id
      );
    }
  }
}
