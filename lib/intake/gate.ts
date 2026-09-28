import type { EngagementStatus } from "@/lib/types";

/**
 * Brent reviews every deck before the customer sees it. Slide content and the
 * .pptx download are withheld until he approves — `drafting` and
 * `ready_for_review` are pre-approval states and must expose neither.
 */
export function canCustomerSeeDeck(status: EngagementStatus | string): boolean {
  return status === "approved" || status === "delivered";
}

/** Statuses where the customer has a deck page at all (waiting screen or deck). */
export function hasCustomerDeckPage(status: EngagementStatus | string): boolean {
  return (
    status === "drafting" ||
    status === "ready_for_review" ||
    canCustomerSeeDeck(status)
  );
}
