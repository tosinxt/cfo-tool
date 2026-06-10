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
  generatedAt: string;
  model: string;
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
