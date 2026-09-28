import { QUESTION_BANK } from "./bank";
import {
  SECTION_LABELS,
  SECTION_ORDER,
  type IntakeV2,
  type QuestionDef,
} from "./types";

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (typeof value[0] === "string") return (value as string[]).join(", ");
    return (value as Record<string, unknown>[])
      .map((m) => `  - ${m.name} (${m.role}): ${m.bio}`)
      .join("\n");
  }
  return typeof value === "string" ? value : "";
}

/**
 * Render bank answers into the draft prompt.
 *
 * Two things matter here beyond formatting: follow-ups are nested under the
 * parent they refine so the model sees them as elaboration rather than new
 * topics, and anything the founder did not mark `confirmed` is explicitly
 * labelled so the deck never presents a guess as a verified fact.
 */
export function renderPromptFromBank(
  v2: IntakeV2,
  client: { clientName?: string; clientEmail?: string }
): string {
  const { answers, industry_branch: branch } = v2;
  const lines: string[] = [];

  lines.push("CLIENT INFORMATION");
  lines.push(`Name: ${client.clientName || "Not provided"}`);
  lines.push(`Email: ${client.clientEmail || "Not provided"}`);
  lines.push(`Business type: ${v2.business_type}`);
  lines.push(`Industry branch: ${branch ?? "not specified"}`);

  const applicable: QuestionDef[] = QUESTION_BANK.filter(
    (q) => q.section !== "gate" && (!q.branch || q.branch === branch)
  );

  const emit = (q: QuestionDef, indent: string) => {
    const record = answers[q.id];
    const label = q.promptLabel ?? q.label;
    const text = record ? renderValue(record.value).trim() : "";

    if (!text) {
      lines.push(`${indent}${label}: Not provided`);
      return;
    }
    const flag =
      record && record.confidence !== "confirmed"
        ? " (founder estimate — do not present as verified)"
        : "";
    if (text.includes("\n")) {
      lines.push(`${indent}${label}:${flag}`);
      lines.push(text);
    } else {
      lines.push(`${indent}${label}: ${text}${flag}`);
    }
  };

  for (const section of SECTION_ORDER) {
    const questions = applicable.filter((q) => q.section === section);
    if (!questions.length) continue;

    lines.push("");
    lines.push(`## ${SECTION_LABELS[section].toUpperCase()}`);

    const parents = questions
      .filter((q) => !q.parentId)
      .sort((a, b) => a.order - b.order);
    const followUps = questions.filter((q) => q.parentId);

    for (const parent of parents) {
      emit(parent, "");
      const children = followUps
        .filter((c) => c.parentId === parent.id)
        .sort((a, b) => a.order - b.order);
      for (const child of children) emit(child, "  \u21b3 ");
    }

    // Follow-ups whose parent sits in another section still need emitting.
    for (const orphan of followUps.filter(
      (c) => !parents.some((p) => p.id === c.parentId)
    )) {
      emit(orphan, "  \u21b3 ");
    }
  }

  if (v2.legacy_extras && Object.keys(v2.legacy_extras).length) {
    lines.push("");
    lines.push("## ADDITIONAL CONTEXT");
    for (const [label, value] of Object.entries(v2.legacy_extras)) {
      lines.push(`${label}: ${value}`);
    }
  }

  return lines.join("\n");
}
