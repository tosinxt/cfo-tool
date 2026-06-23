import PptxGenJS from "pptxgenjs";
import type { AIDraft, DeckSlide } from "@/lib/ai/types";
import { getTheme, type PptxTheme, type DesignSpec } from "@/lib/pptx/themes";

const SLIDE_W = 10;
const SLIDE_H = 5.625;

function applyBackground(slide: PptxGenJS.Slide, theme: PptxTheme): void {
  slide.background = { color: theme.bg };
}

function addEyebrowAndTitle(pptx: PptxGenJS, s: PptxGenJS.Slide, theme: PptxTheme, label: string, title: string): void {
  s.addText(label, {
    x: 0.5,
    y: 0.25,
    w: 3,
    h: 0.28,
    fontSize: 9,
    color: theme.accent,
    fontFace: theme.font,
    bold: true,
  });

  s.addText(title, {
    x: 0.5,
    y: 0.6,
    w: SLIDE_W - 1,
    h: 0.75,
    fontSize: 24,
    bold: true,
    color: theme.text,
    fontFace: theme.font,
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.4,
    w: SLIDE_W - 1,
    h: 0.025,
    fill: { color: theme.accent },
    line: { color: theme.accent },
  });
}

function addTitleSlide(pptx: PptxGenJS, theme: PptxTheme, slide: DeckSlide, companyName: string): void {
  const s = pptx.addSlide();
  applyBackground(s, theme);

  s.addText(companyName, {
    x: 0.5,
    y: 1.4,
    w: SLIDE_W - 1,
    h: 1,
    fontSize: 36,
    bold: true,
    color: theme.text,
    fontFace: theme.font,
  });

  s.addText(slide.bullets[0] || slide.title, {
    x: 0.5,
    y: 2.5,
    w: SLIDE_W - 1,
    h: 0.6,
    fontSize: 18,
    color: theme.subtext,
    fontFace: theme.font,
  });

  if (slide.bullets[1]) {
    s.addText(slide.bullets[1], {
      x: 0.5,
      y: 3.2,
      w: SLIDE_W - 1,
      h: 0.5,
      fontSize: 14,
      color: theme.accent,
      fontFace: theme.font,
    });
  }

  s.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 0.08,
    h: 0.9,
    fill: { color: theme.accent },
    line: { color: theme.accent },
  });
}

function addContentSlide(pptx: PptxGenJS, theme: PptxTheme, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s, theme);
  addEyebrowAndTitle(pptx, s, theme, slide.slideType.toUpperCase(), slide.title);

  const bulletObjs = slide.bullets.map((b) => ({
    text: b,
    options: { bullet: { type: "bullet" as const }, paraSpaceAfter: 6 } as PptxGenJS.TextPropsOptions,
  }));

  s.addText(bulletObjs, {
    x: 0.5,
    y: 1.55,
    w: SLIDE_W - 1,
    h: SLIDE_H - 2.0,
    fontSize: 13,
    color: theme.text,
    fontFace: theme.font,
    valign: "top",
  });
}

function addTeamSlideGrid(pptx: PptxGenJS, theme: PptxTheme, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s, theme);
  addEyebrowAndTitle(pptx, s, theme, "TEAM", slide.title);

  const perCol = Math.ceil(slide.bullets.length / 2);
  slide.bullets.forEach((b, i) => {
    const col = i < perCol ? 0 : 1;
    const row = i % perCol;
    s.addText(b, {
      x: 0.5 + col * 4.75,
      y: 1.7 + row * 0.8,
      w: 4.5,
      h: 0.75,
      fontSize: 12,
      color: theme.text,
      fontFace: theme.font,
      valign: "top",
    });
  });
}

function addTeamSlideList(pptx: PptxGenJS, theme: PptxTheme, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s, theme);
  addEyebrowAndTitle(pptx, s, theme, "TEAM", slide.title);

  const rowH = Math.min(0.9, (SLIDE_H - 1.7) / Math.max(slide.bullets.length, 1));
  slide.bullets.forEach((b, i) => {
    const y = 1.6 + i * rowH;
    s.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: y + rowH - 0.12,
      w: SLIDE_W - 1,
      h: 0.012,
      fill: { color: theme.subtext },
      line: { color: theme.subtext },
    });
    s.addText(b, {
      x: 0.5,
      y,
      w: SLIDE_W - 1,
      h: rowH - 0.15,
      fontSize: 12,
      color: theme.text,
      fontFace: theme.font,
      valign: "middle",
    });
  });
}

function addFinancialsSlideCards(pptx: PptxGenJS, theme: PptxTheme, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s, theme);
  addEyebrowAndTitle(pptx, s, theme, "FINANCIALS", slide.title);

  slide.bullets.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    s.addShape(pptx.ShapeType.rect, {
      x: 0.5 + col * 3.05,
      y: 1.6 + row * 1.5,
      w: 2.9,
      h: 1.3,
      fill: { color: theme.surface },
      line: { color: theme.accent, pt: 1 },
    });
    s.addText(b, {
      x: 0.6 + col * 3.05,
      y: 1.7 + row * 1.5,
      w: 2.7,
      h: 1.1,
      fontSize: 11,
      color: theme.text,
      fontFace: theme.font,
      valign: "middle",
      align: "center",
    });
  });
}

function addFinancialsSlideTable(pptx: PptxGenJS, theme: PptxTheme, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s, theme);
  addEyebrowAndTitle(pptx, s, theme, "FINANCIALS", slide.title);

  const rows = slide.bullets.map((b) => [
    {
      text: b,
      options: {
        fontSize: 12,
        color: theme.text,
        fontFace: theme.font,
        fill: { color: theme.surface },
        valign: "middle" as const,
        margin: [6, 10, 6, 10] as [number, number, number, number],
      },
    },
  ]);

  s.addTable(rows, {
    x: 0.5,
    y: 1.6,
    w: SLIDE_W - 1,
    colW: [SLIDE_W - 1],
    border: { type: "solid", color: theme.accent, pt: 0.5 },
    autoPage: false,
  });
}

export async function buildDeck(draft: AIDraft, companyName: string): Promise<Buffer> {
  const design: Partial<DesignSpec> | undefined = draft.design;
  const theme = getTheme(design?.themeId);
  const financialsLayout = design?.financialsLayout ?? "cards";
  const teamLayout = design?.teamLayout ?? "grid";

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CFO Pitch Advisor";
  pptx.subject = `${companyName} — Series A Pitch Deck`;
  pptx.title = `${companyName} Series A`;

  for (const slide of draft.deckOutline) {
    switch (slide.slideType) {
      case "title":
        addTitleSlide(pptx, theme, slide, companyName);
        break;
      case "team":
        teamLayout === "list" ? addTeamSlideList(pptx, theme, slide) : addTeamSlideGrid(pptx, theme, slide);
        break;
      case "financials":
        financialsLayout === "table"
          ? addFinancialsSlideTable(pptx, theme, slide)
          : addFinancialsSlideCards(pptx, theme, slide);
        break;
      default:
        addContentSlide(pptx, theme, slide);
    }
  }

  const buf = await pptx.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}
