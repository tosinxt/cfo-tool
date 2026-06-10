import { Timestamp } from "firebase/firestore";
import type { DeckSlide, ReportSection } from "./ai/types";

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

/** @deprecated use IntakeFormData */
export interface IntakeData {
  companyName: string;
  industry: string;
  foundedYear: number;
  teamSize: number;
  revenueStage: string;
  fundingAmount: number;
  useOfFunds: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  competitiveAdvantage: string;
  traction: string;
  financialHighlights: string;
  founderBackground: string;
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
  editedBy: string;
  editedAt: Timestamp;
  notes?: string;
}

export interface FileError {
  message: string;
  failedAt: Timestamp;
}

export interface EngagementFiles {
  deckUrl?: string;
  deckPath?: string;
  deckVersion?: number;
  deckError?: FileError;
  reportUrl?: string;
  reportPath?: string;
  reportVersion?: number;
  reportError?: FileError;
  supplementaryUrls?: string[];
  supplementaryPaths?: string[];
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
  aiDraft?: AiDraft & { deckOutline?: DeckSlide[]; reportSections?: ReportSection[] };
  cfoEdits?: CfoEdits;
  files?: EngagementFiles;
}

export type EngagementEventType =
  | "engagement_created"
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
