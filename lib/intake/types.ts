import { z } from "zod";

export type Branch = "industrial" | "technology";
export type BusinessType = "b2b" | "b2c" | "other";

export type SectionId =
  | "gate"
  | "basics"
  | "thesis"
  | "problem"
  | "solution"
  | "demand"
  | "market"
  | "commercial"
  | "competition"
  | "growth"
  | "financials"
  | "team"
  | "raise";

export type WidgetKind =
  | "text"
  | "textarea"
  | "charTextarea"
  | "select"
  | "pillSelect"
  | "radioPills"
  | "slider"
  | "money"
  | "allocation"
  | "projections"
  | "tags"
  | "teamRepeater"
  | "yesNo";

export type Confidence = "confirmed" | "estimate" | "unknown";
export type AnswerStatus = "answered" | "skipped" | "requested" | "updated_after_submit";

export interface TeamMemberValue {
  name: string;
  role: string;
  bio: string;
}

export type AnswerValue = string | string[] | TeamMemberValue[];

export interface QuestionDef {
  /** Stable Firestore answer key — never renumber, answers are keyed by it. */
  id: string;
  section: SectionId;
  order: number;
  /** Absent = universal (asked of everyone). */
  branch?: Branch;
  /** Set on industry follow-ups; points at the universal parent question. */
  parentId?: string;
  label: string;
  helper?: string;
  placeholder?: string;
  /** Rendered as one-tap QuickChips. */
  examples?: string[];
  widget: WidgetKind;
  options?: { value: string; label: string }[];
  required: boolean;
  validate: z.ZodType;
  /** Natural-language line handed to the chat interviewer/extractor. */
  aiSpec: string;
  /** Heading used when rendering this answer into the draft prompt. */
  promptLabel?: string;
  /** Phase 2 — recorded now so the schema does not need to change later. */
  allowAttachments?: boolean;
}

export interface AnswerRecord {
  question_id: string;
  section: SectionId;
  branch: Branch | null;
  value: AnswerValue;
  confidence: Confidence;
  /** Always [] in Phase 1 — uploads are deferred. */
  attachments: { name: string; note?: string }[];
  status: AnswerStatus;
  reviewer_note: string | null;
  updated_at: unknown;
}

export type AnswerMap = Record<string, AnswerRecord>;

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "info_requested"
  | "complete";

export interface IntakeV2 {
  business_type: BusinessType;
  industry_branch: Branch | null;
  submission_status: SubmissionStatus;
  deck_version: number;
  answers: AnswerMap;
  updatedAt: unknown;
  submittedAt?: unknown;
  /**
   * Legacy fields with no question-bank equivalent, preserved so migrated
   * pre-refactor engagements still carry them into the draft prompt.
   */
  legacy_extras?: Record<string, string>;
}

export const SECTION_LABELS: Record<SectionId, string> = {
  gate: "Getting started",
  basics: "Company basics",
  thesis: "Investment thesis",
  problem: "Problem",
  solution: "Solution & value",
  demand: "Evidence of demand",
  market: "Market",
  commercial: "Commercial model",
  competition: "Competitive position",
  growth: "Growth plan",
  financials: "Financial picture",
  team: "Team",
  raise: "The ask",
};

/**
 * Wizard step order. `gate` is handled by its own screen before the wizard,
 * so it is not a step here.
 */
export const SECTION_ORDER: SectionId[] = [
  "basics",
  "thesis",
  "problem",
  "solution",
  "demand",
  "market",
  "commercial",
  "competition",
  "growth",
  "financials",
  "team",
  "raise",
];

/**
 * Brent to confirm the exact figure. Until then: warn at submit when more than
 * this share of required questions are unanswered or marked "don't know yet".
 */
export const SKIPPED_WARNING_THRESHOLD = 0.3;

export const HELPER_BOILERPLATE =
  "Answer to the best of your ability. If you're estimating, say so.";
