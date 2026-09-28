import { questionsForBranch } from "./schema";
import { SECTION_LABELS, SECTION_ORDER, type Branch, type QuestionDef } from "./types";

function specLine(q: QuestionDef): string {
  const bits: string[] = [];
  bits.push(`- ${q.id}`);
  if (q.widget === "teamRepeater") {
    bits.push("(array of {name, role, bio}, 1-8 entries, each non-empty)");
  } else if (q.options?.length) {
    bits.push(`(one of: ${q.options.map((o) => `"${o.value}"`).join(", ")})`);
  } else {
    bits.push("(string)");
  }
  bits.push(`${q.required ? "[REQUIRED]" : "[optional]"}:`);
  bits.push(q.aiSpec);
  if (q.helper) bits.push(`Helper shown to the founder: ${q.helper}`);
  return bits.join(" ");
}

/**
 * Build the interviewer/extractor field spec from the question bank.
 *
 * Follow-ups for the chosen branch are included so the interviewer asks them,
 * even though they are optional and therefore never block completion.
 */
export function buildFieldSpec(branch?: Branch | null): string {
  const questions = questionsForBranch(branch);
  const lines: string[] = [];

  for (const section of ["gate", ...SECTION_ORDER] as const) {
    const inSection = questions
      .filter((q) => q.section === section)
      .sort((a, b) => a.order - b.order);
    if (!inSection.length) continue;
    lines.push("");
    lines.push(`# ${SECTION_LABELS[section]}`);
    for (const q of inSection) lines.push(specLine(q));
  }

  return lines.join("\n");
}

export function buildInterviewerPrompt(branch?: Branch | null): string {
  const branchNote = branch
    ? `The founder has told you this is a ${branch} company. Ask the ${branch} follow-up questions and do NOT ask questions belonging to the other branch.`
    : `You do not yet know whether this is an Industrial or a Technology company. Establish that EARLY — right after the company basics — because it determines which follow-up questions apply. Until you know, stick to the universal questions.`;

  return `You are a friendly, sharp analyst conducting a live interview with a founder to gather everything needed for an investor-ready pitch deck. Ask ONE question at a time, conversationally — never list multiple questions in one message. Ask natural follow-ups when an answer is too short or vague to be usable, but don't be pedantic once you have something usable.

Before asking about a topic, re-read what the founder has already told you. If their prior answers make the next answer obvious, don't ask from scratch — state your inference in one sentence and ask them to confirm or correct it. Never ask a question that ignores context you were just given.

${branchNote}

Tell founders it is fine to estimate. If they are guessing, acknowledge it and move on rather than pressing for precision they don't have.

Reply with plain conversational text only — no JSON, no markdown, no field names, no code fences. Just talk like a person.

You need to eventually cover these topics:
${buildFieldSpec(branch)}

Cover them in a sensible order (company basics → industry → thesis → problem → solution → demand → market → commercial model → competition → growth → financials → team → the ask), adapting to what the founder volunteers.`;
}

export function buildExtractorPrompt(branch?: Branch | null): string {
  return `You extract structured data from an interview transcript between an analyst and a founder. You will be given the transcript and a JSON object of fields already known. Return ONLY a raw JSON object (no markdown, no code fences, no commentary) mapping any of these field ids to values you can confidently determine from the WHOLE transcript so far:
${buildFieldSpec(branch)}

Rules:
- Only include a field if the transcript actually supports a confident value. Omit fields you're unsure about rather than guessing.
- Fields with a fixed option list must use exactly one of the listed values.
- "team_members" must be an array of objects: {"name": string, "role": string, "bio": string}.
- For narrative fields, write a clean 1-3 sentence summary in the founder's own words and numbers — don't copy a one-word fragment.
- Merge with, don't contradict, the fields already known unless the founder corrected themselves.
- Return {} if nothing new can be confidently extracted.`;
}
