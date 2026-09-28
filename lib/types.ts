import { Timestamp } from "firebase/firestore";
import type { DeckSlide, ReportSection, DraftProgress } from "./ai/types";
import type { DesignSpec } from "./pptx/themes";
import type { IntakeV2 } from "./intake/types";

export type EngagementStatus =
  | "paid"
  | "awaiting_intake"
  | "drafting"
  | "ready_for_review"
  | "approved"
  | "delivered";

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

/**
 * Legacy flat intake, superseded by the question bank (`lib/intake/bank.ts`).
 * Retained only so `migrateLegacyIntake` can read pre-refactor engagements —
 * nothing writes this shape any more.
 */
export interface IntakeFormData {
  // Step 1 – Company basics
  companyName: string;
  oneLiner: string;
  sector: string;
  stage: string;

  // Step 2 – Problem / solution / market
  problem: string;
  solution: string;
  marketSize: string;

  // Step 3 – Traction & KPIs
  keyMetrics: string;
  growthRate: string;
  notableCustomers: string;

  // Step 4 – Team
  teamMembers: TeamMember[];

  // Step 5 – Financials
  currentRevenue: string;
  burnRate: string;
  runway: string;
  threeYearProjections: string;

  // Step 6 – The raise
  raiseAmount: string;
  valuationExpectation: string;
  useOfFunds: string;
  currentInvestors: string;

  submittedAt: Timestamp;
}

export interface AiDraft {
  executiveSummary: string;
  problemSlide: string;
  solutionSlide: string;
  marketSlide: string;
  tractionSlide: string;
  financialsSlide: string;
  teamSlide: string;
  askSlide: string;
  generatedAt: Timestamp;
  modelVersion: string;
}

export interface CfoEdits {
  editedContent?: Partial<AiDraft>;
  deckOutline?: DeckSlide[];
  reportSections?: ReportSection[];
  design?: DesignSpec;
  editedBy: string;
  editedAt: Timestamp;
  notes?: string;
}

export interface FileError {
  message: string;
  failedAt: Timestamp;
}

// Files are built on demand from aiDraft/cfoEdits at download time (no Cloud
// Storage dependency) — this only tracks the last build error, if any.
export interface EngagementFiles {
  deckError?: FileError;
  reportError?: FileError;
}

export interface Engagement {
  id: string;
  clientEmail: string;
  clientName: string;
  status: EngagementStatus;
  stripeSessionId: string;
  pricePaid: number;
  intakeToken: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
  intakeSubmittedAt?: Timestamp;
  intake?: IntakeFormData;
  intakeV2?: IntakeV2;
  aiDraft?: AiDraft & { deckOutline?: DeckSlide[]; reportSections?: ReportSection[]; design?: DesignSpec };
  cfoEdits?: CfoEdits;
  files?: EngagementFiles;
  draftProgress?: DraftProgress;
}

export type EngagementEventType =
  | "engagement_created"
  | "intake_draft_started"
  | "payment_confirmed"
  | "intake_submitted"
  | "draft_generated"
  | "intake_edit"
  | "deck_edit"
  | "report_edit"
  | "edits_saved"
  | "approved"
  | "delivered";

export interface EngagementEvent {
  id: string;
  engagementId: string;
  type: EngagementEventType;
  actorUid: string | null;
  actorEmail: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: "admin";
  createdAt: Timestamp;
}
