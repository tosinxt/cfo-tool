import * as Sentry from "@sentry/nextjs";
import {
  STAGE_ANALYZE_PROMPT,
  STAGE_OUTLINE_PROMPT,
  STAGE_REPORT_PROMPT,
  buildStageDesignPrompt,
} from "./cfoSkill";
import { fetchCfoAddendum } from "./fetchCfoAddendum";
import {
  AIDraft,
  DiligenceBrief,
  DraftGenerationError,
  DraftStageId,
  DRAFT_STAGES,
  DeckSlide,
  ReportSection,
} from "./types";
import { PPTX_THEMES, THEME_IDS, type DesignSpec } from "@/lib/pptx/themes";
import type { Engagement } from "@/lib/types";

const MODEL = "anthropic/claude-sonnet-4-5";
const MAX_TOKENS = 8000;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OnStageProgress = (stage: DraftStageId) => void | Promise<void>;

function buildIntakePrompt(engagement: Engagement): string {
  const { intake, clientName, clientEmail } = engagement;
  if (!intake) throw new DraftGenerationError("No intake data found", "NO_INTAKE", engagement.id);

  const team = intake.teamMembers
    .map((m) => `  - ${m.name} (${m.role}): ${m.bio}`)
    .join("\n");

  return `CLIENT INFORMATION
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
Current Investors: ${intake.currentInvestors || "None / not disclosed"}`;
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  strict = false
): Promise<string> {
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
        { role: "system", content: systemPrompt + strictSection },
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

function cleanJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function callStageJson<T>(
  systemPrompt: string,
  userPrompt: string,
  validate: (parsed: unknown) => parsed is T,
  stage: DraftStageId,
  engagementId: string
): Promise<T> {
  let raw: string;
  try {
    raw = await callOpenRouter(systemPrompt, userPrompt, false);
  } catch (err) {
    throw new DraftGenerationError(
      `[${stage}] API call failed: ${(err as Error).message}`,
      "OPENROUTER_API_ERROR",
      engagementId
    );
  }

  const tryParse = (text: string): T | null => {
    try {
      const parsed = JSON.parse(cleanJson(text));
      return validate(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  let result = tryParse(raw);
  if (!result) {
    let retryRaw: string;
    try {
      retryRaw = await callOpenRouter(systemPrompt, userPrompt, true);
    } catch (err) {
      throw new DraftGenerationError(
        `[${stage}] API retry failed: ${(err as Error).message}`,
        "OPENROUTER_RETRY_ERROR",
        engagementId
      );
    }
    result = tryParse(retryRaw);
    if (!result) {
      throw new DraftGenerationError(`[${stage}] Malformed JSON after retry`, "MALFORMED_JSON", engagementId);
    }
  }

  return result;
}

function isDiligenceBrief(p: unknown): p is DiligenceBrief {
  const b = p as Partial<DiligenceBrief>;
  return Array.isArray(b?.keyFacts) && Array.isArray(b?.diligenceGaps);
}

function isOutlineResult(p: unknown): p is { deckOutline: DeckSlide[] } {
  const b = p as { deckOutline?: unknown };
  return Array.isArray(b?.deckOutline);
}

function isReportResult(p: unknown): p is { reportSections: ReportSection[] } {
  const b = p as { reportSections?: unknown };
  return Array.isArray(b?.reportSections);
}

function isDesignSpec(p: unknown): p is DesignSpec {
  const b = p as Partial<DesignSpec>;
  return (
    typeof b?.themeId === "string" &&
    THEME_IDS.includes(b.themeId as DesignSpec["themeId"]) &&
    (b.financialsLayout === "cards" || b.financialsLayout === "table") &&
    (b.teamLayout === "grid" || b.teamLayout === "list")
  );
}

export async function generateDraft(
  engagement: Engagement,
  onProgress?: OnStageProgress
): Promise<AIDraft> {
  const intakePrompt = buildIntakePrompt(engagement);
  const cfoAddendum = await fetchCfoAddendum();

  if (!cfoAddendum && process.env.NODE_ENV === "production") {
    const msg = `[generateDraft] CFO addendum is empty for engagement ${engagement.id} — proprietary methodology will not be applied.`;
    console.warn(msg);
    Sentry.captureMessage(msg, { level: "warning", extra: { engagementId: engagement.id } });
  }

  const addendumSection = cfoAddendum
    ? `\n\n## CFO PROPRIETARY METHODOLOGY NOTES\n\n${cfoAddendum}`
    : "";

  // Stage 1 — analyze
  await onProgress?.(DRAFT_STAGES[0].id);
  const brief = await callStageJson<DiligenceBrief>(
    STAGE_ANALYZE_PROMPT + addendumSection,
    intakePrompt,
    isDiligenceBrief,
    "analyze",
    engagement.id
  );

  const briefSection = `\n\nKEY FACTS (from analysis stage)\n${brief.keyFacts.map((f) => `- ${f}`).join("\n")}\n\nDILIGENCE GAPS (from analysis stage)\n${brief.diligenceGaps.map((g) => `- ${g}`).join("\n")}`;

  // Stage 2 — deck outline
  await onProgress?.(DRAFT_STAGES[1].id);
  const { deckOutline } = await callStageJson<{ deckOutline: DeckSlide[] }>(
    STAGE_OUTLINE_PROMPT + addendumSection,
    intakePrompt + briefSection,
    isOutlineResult,
    "outline",
    engagement.id
  );

  const outlineSection = `\n\nDECK OUTLINE (from outline stage, for narrative consistency)\n${JSON.stringify(deckOutline, null, 2)}`;

  // Stage 3 — investor report
  await onProgress?.(DRAFT_STAGES[2].id);
  const { reportSections } = await callStageJson<{ reportSections: ReportSection[] }>(
    STAGE_REPORT_PROMPT + addendumSection,
    intakePrompt + briefSection + outlineSection,
    isReportResult,
    "report",
    engagement.id
  );

  // Stage 4 — design (theme + layout selection). Cosmetic only — falls back to
  // the default theme rather than failing the whole pipeline if it errors out.
  await onProgress?.(DRAFT_STAGES[3].id);
  const themeCatalog = THEME_IDS.map((id) => `- "${id}": ${PPTX_THEMES[id].description}`).join("\n");
  let design: DesignSpec;
  try {
    design = await callStageJson<DesignSpec>(
      buildStageDesignPrompt(themeCatalog) + addendumSection,
      intakePrompt + briefSection + outlineSection,
      isDesignSpec,
      "design",
      engagement.id
    );
  } catch (err) {
    console.error(`[generateDraft] design stage failed for ${engagement.id}, falling back to default theme: ${(err as Error).message}`);
    design = { themeId: "midnight", financialsLayout: "cards", teamLayout: "grid", rationale: "fallback" };
  }

  // Stage 5 — finalize / assemble
  await onProgress?.(DRAFT_STAGES[4].id);

  if (!Array.isArray(deckOutline) || !Array.isArray(reportSections)) {
    throw new DraftGenerationError(
      "Response missing deckOutline or reportSections arrays",
      "MALFORMED_JSON",
      engagement.id
    );
  }

  return {
    deckOutline,
    reportSections,
    diligenceGaps: brief.diligenceGaps,
    design,
    generatedAt: new Date().toISOString(),
    model: MODEL,
  };
}
