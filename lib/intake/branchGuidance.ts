import type { Branch } from "./types";

/**
 * Per-industry framing rules for the draft prompt.
 *
 * These cannot live in the admin-editable `config/cfoSkill` addendum: that
 * string is global across every engagement, while these rules are chosen per
 * company. They also can't live in CFO_BASE_PROMPT, which is shared by all
 * four generation stages and is written in SaaS vocabulary.
 */
export const BRANCH_PROMPT_PREAMBLE: Record<Branch, string> = {
  industrial: `## INDUSTRY CONTEXT — INDUSTRIAL COMPANY

This is an industrial business, not a software company. Software metrics do not
apply and using them will make the deck read as generic AI output.

FORBIDDEN VOCABULARY — do not use these words or frame anything around them:
ARR, MRR, NRR, churn, churn rate, retention rate, MoM growth, DAU/MAU,
land-and-expand, product-led growth, burn multiple, CAC payback.

USE INSTEAD — the metrics an industrial investor actually underwrites:
- Backlog (dollar value and months of work it represents)
- Orders on hand
- Repeat customers and share of revenue from them
- Headcount and equipment utilization
- Capacity constraints and what it costs to lift them
- Contract terms, margin per job, and unit economics per site or crew

CRITICAL FRAMING RULE: a customer who has not bought in three years is NOT
churn and NOT a lost customer. In industrial work the job was completed and the
customer has no current need. Never describe lapsed customers as attrition,
churn, or a retention problem. Where relevant, frame them as a repeat-business
opportunity or as evidence of completed delivery.

Growth is framed as capacity, geography, and capability — locations, people,
and equipment — not as product releases or user acquisition.`,

  technology: `## INDUSTRY CONTEXT — TECHNOLOGY COMPANY

This is a technology business. SaaS and software metrics apply and investors
expect them.

USE: ARR/MRR, retention and churn, net revenue retention, usage and active
users (distinct from subscription counts), paid versus free split, sales cycle
length, deployments and design wins, gross margin, CAC/LTV.

BENCHMARKS TO APPLY WHEN THE DATA SUPPORTS IT:
- Annual churn at or below 20% reads as fundable.
- Churn approaching 50% is a red flag and must be addressed directly rather
  than omitted.
- Retention is the inverse of churn — do not present both as separate wins.
- Always frame growth NET of churn. If the company grew 40% and churned 20%,
  the honest figure to lead with is 20% net growth.

Separate paid customers from free users everywhere. Technology companies give a
lot away, and conflating the two is the single fastest way to lose credibility
with a CFO reading the deck.

Do NOT ask about or recommend new physical locations unless the company builds
physical infrastructure such as data centres. Growth is roadmap, R&D capacity,
and compute — not real estate.`,
};

export function branchPreamble(branch: Branch | null | undefined): string {
  if (!branch) return "";
  return "\n\n" + BRANCH_PROMPT_PREAMBLE[branch];
}
