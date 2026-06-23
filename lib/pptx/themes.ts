export interface PptxTheme {
  id: string;
  name: string;
  description: string;
  bg: string;
  surface: string;
  text: string;
  subtext: string;
  accent: string;
  font: string;
}

export const PPTX_THEMES = {
  midnight: {
    id: "midnight",
    name: "Midnight Navy",
    description: "Dark navy with a cool blue accent. Default choice for SaaS, fintech, and enterprise software.",
    bg: "0A1628",
    surface: "0E1F3A",
    text: "FFFFFF",
    subtext: "8892A4",
    accent: "4F8EF7",
    font: "Calibri",
  },
  editorial: {
    id: "editorial",
    name: "Editorial Cream",
    description: "Warm cream background, ink text, terracotta accent, serif display. Best for consumer brands, media, and DTC.",
    bg: "F7F3EC",
    surface: "FFFFFF",
    text: "1A1A1A",
    subtext: "6B6358",
    accent: "B5562B",
    font: "Georgia",
  },
  graphite: {
    id: "graphite",
    name: "Graphite Mono",
    description: "Near-black graphite with a single neon-green accent and monospace type. Best for dev tools, infra, and security.",
    bg: "15171A",
    surface: "1E2024",
    text: "F5F5F0",
    subtext: "8A8D91",
    accent: "39FF88",
    font: "Consolas",
  },
  azure: {
    id: "azure",
    name: "Azure Light",
    description: "White background, navy text, sky-blue accent. Best for healthcare, legal, and traditionally conservative buyers.",
    bg: "FFFFFF",
    surface: "F2F6FC",
    text: "0A1628",
    subtext: "5B6B82",
    accent: "0081C0",
    font: "Calibri",
  },
} as const satisfies Record<string, PptxTheme>;

export type ThemeId = keyof typeof PPTX_THEMES;

export const THEME_IDS = Object.keys(PPTX_THEMES) as ThemeId[];

export function getTheme(id: string | undefined): PptxTheme {
  return PPTX_THEMES[(id as ThemeId) in PPTX_THEMES ? (id as ThemeId) : "midnight"];
}

export type FinancialsLayout = "cards" | "table";
export type TeamLayout = "grid" | "list";

export interface DesignSpec {
  themeId: ThemeId;
  financialsLayout: FinancialsLayout;
  teamLayout: TeamLayout;
  rationale: string;
}
