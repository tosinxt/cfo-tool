import { QUESTIONS_BY_ID } from "./bank";
import type {
  AnswerMap,
  AnswerRecord,
  AnswerValue,
  Branch,
  Confidence,
  IntakeV2,
  QuestionDef,
} from "./types";
import type { IntakeFormData } from "@/lib/types";

export function makeAnswer(
  q: QuestionDef,
  value: AnswerValue,
  opts: { confidence?: Confidence; branch?: Branch | null } = {}
): AnswerRecord {
  const isEmpty =
    value === "" || (Array.isArray(value) && value.length === 0);
  return {
    question_id: q.id,
    section: q.section,
    branch: q.branch ?? opts.branch ?? null,
    value,
    confidence: opts.confidence ?? "confirmed",
    attachments: [],
    status: isEmpty ? "skipped" : "answered",
    reviewer_note: null,
    updated_at: new Date().toISOString(),
  };
}

export function emptyIntakeV2(): IntakeV2 {
  return {
    business_type: "b2b",
    industry_branch: null,
    submission_status: "draft",
    deck_version: 0,
    answers: {},
    updatedAt: new Date().toISOString(),
  };
}

/** Flat value lookup — most readers only care about the value. */
export function answerValue(answers: AnswerMap, id: string): AnswerValue | undefined {
  return answers[id]?.value;
}

export function answerText(answers: AnswerMap, id: string): string {
  const v = answers[id]?.value;
  return typeof v === "string" ? v : "";
}

/**
 * Legacy flat intake → question-bank answers.
 *
 * Exists so pre-refactor engagements (the demo doc and anything dev-seeded)
 * still render and still generate drafts. Best-effort, not lossless: the few
 * legacy fields with no bank equivalent are preserved in `legacy_extras` so
 * they still reach the draft prompt rather than being silently dropped.
 */
const LEGACY_FIELD_MAP: Record<string, string> = {
  companyName: "company_name",
  oneLiner: "one_liner",
  sector: "sub_industry",
  problem: "customer_problem",
  solution: "what_you_sell",
  marketSize: "tam",
  keyMetrics: "usage_rates",
  notableCustomers: "deployments_design_wins",
  currentRevenue: "revenue_ltm",
  burnRate: "current_burn",
  runway: "runway_months",
  threeYearProjections: "forecast",
  raiseAmount: "raise_amount",
  useOfFunds: "use_of_funds",
  teamMembers: "team_members",
};

const LEGACY_EXTRA_LABELS: Record<string, string> = {
  stage: "Funding stage",
  growthRate: "Growth rate",
  valuationExpectation: "Valuation expectation",
  currentInvestors: "Current investors",
};

export function migrateLegacyIntake(intake: IntakeFormData): IntakeV2 {
  const v2 = emptyIntakeV2();
  // Legacy intake predates branching and was written against SaaS-shaped
  // questions, so technology is the only defensible default.
  v2.industry_branch = "technology";
  v2.submission_status = "submitted";

  for (const [legacyKey, questionId] of Object.entries(LEGACY_FIELD_MAP)) {
    const raw = (intake as unknown as Record<string, unknown>)[legacyKey];
    if (raw === undefined || raw === null || raw === "") continue;
    const q = QUESTIONS_BY_ID[questionId];
    if (!q) continue;
    v2.answers[questionId] = makeAnswer(q, raw as AnswerValue, {
      branch: v2.industry_branch,
    });
  }

  const extras: Record<string, string> = {};
  for (const [legacyKey, label] of Object.entries(LEGACY_EXTRA_LABELS)) {
    const raw = (intake as unknown as Record<string, unknown>)[legacyKey];
    if (typeof raw === "string" && raw.trim()) extras[label] = raw;
  }
  if (Object.keys(extras).length) v2.legacy_extras = extras;

  return v2;
}

/**
 * The one accessor every reader goes through. Returns the v2 shape whether the
 * engagement was written before or after the question-bank refactor.
 */
export function getIntakeAnswers(engagement: {
  intakeV2?: IntakeV2;
  intake?: IntakeFormData;
}): IntakeV2 | null {
  if (engagement.intakeV2) return engagement.intakeV2;
  if (engagement.intake) return migrateLegacyIntake(engagement.intake);
  return null;
}

/** Share of required questions left unanswered or marked "don't know yet". */
export function skippedRequiredRatio(
  answers: AnswerMap,
  required: QuestionDef[]
): number {
  if (!required.length) return 0;
  const missing = required.filter((q) => {
    const a = answers[q.id];
    if (!a) return true;
    if (a.confidence === "unknown") return true;
    const v = a.value;
    return v === "" || (Array.isArray(v) && v.length === 0);
  });
  return missing.length / required.length;
}
