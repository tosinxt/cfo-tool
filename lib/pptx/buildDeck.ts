import PptxGenJS from "pptxgenjs";
import type { AIDraft, DeckSlide } from "@/lib/ai/types";

const NAVY = "0A1628";
const WHITE = "FFFFFF";
const ACCENT = "4F8EF7";
const LIGHT_GRAY = "8892A4";

const FONT = "Calibri";
const SLIDE_W = 10;
const SLIDE_H = 5.625;

function applyBackground(slide: PptxGenJS.Slide): void {
  slide.background = { color: NAVY };
}

function addTitleSlide(pptx: PptxGenJS, slide: DeckSlide, companyName: string): void {
  const s = pptx.addSlide();
  applyBackground(s);

  s.addText(companyName, {
    x: 0.5,
    y: 1.4,
    w: SLIDE_W - 1,
    h: 1,
    fontSize: 36,
    bold: true,
    color: WHITE,
    fontFace: FONT,
  });

  s.addText(slide.bullets[0] || slide.title, {
    x: 0.5,
    y: 2.5,
    w: SLIDE_W - 1,
    h: 0.6,
    fontSize: 18,
    color: LIGHT_GRAY,
    fontFace: FONT,
  });

  if (slide.bullets[1]) {
    s.addText(slide.bullets[1], {
      x: 0.5,
      y: 3.2,
      w: SLIDE_W - 1,
      h: 0.5,
      fontSize: 14,
      color: ACCENT,
      fontFace: FONT,
    });
  }

  // Accent line
  s.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.2,
    w: 0.08,
    h: 0.9,
    fill: { color: ACCENT },
    line: { color: ACCENT },
  });
}

function addContentSlide(pptx: PptxGenJS, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s);

  // Slide label (type badge)
  s.addText(slide.slideType.toUpperCase(), {
    x: 0.5,
    y: 0.25,
    w: 2,
    h: 0.28,
    fontSize: 9,
    color: ACCENT,
    fontFace: FONT,
    bold: true,
  });

  // Title
  s.addText(slide.title, {
    x: 0.5,
    y: 0.6,
    w: SLIDE_W - 1,
    h: 0.75,
    fontSize: 24,
    bold: true,
    color: WHITE,
    fontFace: FONT,
  });

  // Divider
  s.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.4,
    w: SLIDE_W - 1,
    h: 0.025,
    fill: { color: ACCENT },
    line: { color: ACCENT },
  });

  // Bullets
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
    color: WHITE,
    fontFace: FONT,
    valign: "top",
  });
}

function addTeamSlide(pptx: PptxGenJS, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s);

  s.addText("TEAM", {
    x: 0.5,
    y: 0.25,
    w: 2,
    h: 0.28,
    fontSize: 9,
    color: ACCENT,
    fontFace: FONT,
    bold: true,
  });

  s.addText(slide.title, {
    x: 0.5,
    y: 0.6,
    w: SLIDE_W - 1,
    h: 0.75,
    fontSize: 24,
    bold: true,
    color: WHITE,
    fontFace: FONT,
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.4,
    w: SLIDE_W - 1,
    h: 0.025,
    fill: { color: ACCENT },
    line: { color: ACCENT },
  });

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
      color: WHITE,
      fontFace: FONT,
      valign: "top",
    });
  });
}

function addFinancialsSlide(pptx: PptxGenJS, slide: DeckSlide): void {
  const s = pptx.addSlide();
  applyBackground(s);

  s.addText("FINANCIALS", {
    x: 0.5,
    y: 0.25,
    w: 2.5,
    h: 0.28,
    fontSize: 9,
    color: ACCENT,
    fontFace: FONT,
    bold: true,
  });

  s.addText(slide.title, {
    x: 0.5,
    y: 0.6,
    w: SLIDE_W - 1,
    h: 0.75,
    fontSize: 24,
    bold: true,
    color: WHITE,
    fontFace: FONT,
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.4,
    w: SLIDE_W - 1,
    h: 0.025,
    fill: { color: ACCENT },
    line: { color: ACCENT },
  });

  // Metrics cards
  slide.bullets.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    s.addShape(pptx.ShapeType.rect, {
      x: 0.5 + col * 3.05,
      y: 1.6 + row * 1.5,
      w: 2.9,
      h: 1.3,
      fill: { color: "0E1F3A" },
      line: { color: ACCENT, pt: 1 },
    });
    s.addText(b, {
      x: 0.6 + col * 3.05,
      y: 1.7 + row * 1.5,
      w: 2.7,
      h: 1.1,
      fontSize: 11,
      color: WHITE,
      fontFace: FONT,
      valign: "middle",
      align: "center",
    });
  });
}

export async function buildDeck(draft: AIDraft, companyName: string): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CFO Pitch Advisor";
  pptx.subject = `${companyName} — Series A Pitch Deck`;
  pptx.title = `${companyName} Series A`;

  for (const slide of draft.deckOutline) {
    switch (slide.slideType) {
      case "title":
        addTitleSlide(pptx, slide, companyName);
        break;
      case "team":
        addTeamSlide(pptx, slide);
        break;
      case "financials":
        addFinancialsSlide(pptx, slide);
        break;
      default:
        addContentSlide(pptx, slide);
    }
  }

  const buf = await pptx.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}
