import { z } from "zod";
import { QUESTION_BANK } from "./bank";
import type { AnswerMap, Branch, QuestionDef, SectionId } from "./types";

export interface SchemaCtx {
  branch?: Branch | null;
  /** Relax every `required` to optional — used by admin editing and drafts. */
  loose?: boolean;
}

/**
 * Questions that apply to a given branch: all universal ones plus the
 * follow-ups for that branch. With no branch chosen yet, only universal
 * questions are in play — that keeps the chat's progress total from jumping
 * once the founder picks an industry.
 */
export function questionsForBranch(branch?: Branch | null): QuestionDef[] {
  return QUESTION_BANK.filter((q) => !q.branch || q.branch === branch);
}

/**
 * Questions that live in the answers map.
 *
 * The gate (`business_type`) is carried on the submission envelope rather than
 * as an answer, so it must not appear in any derived answer schema — otherwise
 * a genuine submission fails validation on a field it was never meant to send.
 */
export function answerQuestions(branch?: Branch | null): QuestionDef[] {
  return questionsForBranch(branch).filter((q) => q.section !== "gate");
}

/** The questions a renderer should currently show, given answers so far. */
export function visibleQuestions(answers: AnswerMap): QuestionDef[] {
  const branch = answers.industry_branch?.value as Branch | undefined;
  return questionsForBranch(branch).sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id)
  );
}

// zod v4's ZodRawShape is readonly, so build a mutable record and widen once.
function buildShape(questions: QuestionDef[], loose: boolean): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const q of questions) {
    shape[q.id] = q.required && !loose ? q.validate : q.validate.optional();
  }
  return shape;
}

// zodResolver compares by identity — a fresh object each render would make
// react-hook-form re-register every field on every keystroke.
const cache = new Map<string, z.ZodObject>();

function cached(key: string, build: () => z.ZodObject) {
  const hit = cache.get(key);
  if (hit) return hit;
  const built = build();
  cache.set(key, built);
  return built;
}

export function sectionSchema(section: SectionId, ctx: SchemaCtx = {}) {
  const { branch = null, loose = false } = ctx;
  return cached(`section:${section}:${branch}:${loose}`, () =>
    z.object(
      buildShape(
        answerQuestions(branch).filter((q) => q.section === section),
        loose
      )
    )
  );
}

export function submissionSchema(ctx: SchemaCtx = {}) {
  const { branch = null, loose = false } = ctx;
  return cached(`submission:${branch}:${loose}`, () =>
    z.object(buildShape(answerQuestions(branch), loose))
  );
}

/**
 * The chat's "interview is finished" gate. Only required questions count, so
 * optional branch follow-ups never block completion.
 */
export function completionGateSchema(ctx: SchemaCtx = {}) {
  const { branch = null } = ctx;
  return cached(`completion:${branch}`, () =>
    z.object(
      buildShape(
        answerQuestions(branch).filter((q) => q.required),
        false
      )
    )
  );
}

/** Required questions for a branch — drives progress counts and the nudge. */
export function requiredQuestions(branch?: Branch | null): QuestionDef[] {
  return answerQuestions(branch).filter((q) => q.required);
}

export function sectionsForBranch(branch?: Branch | null): SectionId[] {
  const present = new Set(answerQuestions(branch).map((q) => q.section));
  return (
    [
      "basics", "thesis", "problem", "solution", "demand", "market",
      "commercial", "competition", "growth", "financials", "team", "raise",
    ] as SectionId[]
  ).filter((s) => present.has(s));
}
