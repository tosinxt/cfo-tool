import type { DesignSpec } from "../pptx/themes";

export type SlideType =
  | "title"
  | "problem"
  | "solution"
  | "market"
  | "traction"
  | "team"
  | "financials"
  | "ask"
  | "appendix";

export interface DeckSlide {
  slideType: SlideType;
  title: string;
  bullets: string[];
  speakerNotes: string;
}

export interface ReportSection {
  heading: string;
  body: string;
}

export interface AIDraft {
  deckOutline: DeckSlide[];
  reportSections: ReportSection[];
  diligenceGaps: string[];
  design?: DesignSpec;
  generatedAt: string;
  model: string;
}

export interface DiligenceBrief {
  keyFacts: string[];
  diligenceGaps: string[];
}

export const DRAFT_STAGES = [
  { id: "analyze", label: "Analyzing intake & flagging diligence gaps" },
  { id: "outline", label: "Drafting deck outline" },
  { id: "report", label: "Writing investor report" },
  { id: "design", label: "Choosing deck theme & layout" },
  { id: "finalize", label: "Finalizing & saving draft" },
] as const;

export type DraftStageId = (typeof DRAFT_STAGES)[number]["id"];

export interface DraftProgress {
  stage: DraftStageId;
  stageIndex: number;
  totalStages: number;
  label: string;
  updatedAt: string;
}

export class DraftGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly engagementId: string
  ) {
    super(message);
    this.name = "DraftGenerationError";
  }
}
