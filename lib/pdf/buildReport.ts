import PDFDocument from "pdfkit";
import type { AIDraft } from "@/lib/ai/types";

const NAVY = "#0A1628";
const ACCENT = "#4F8EF7";
const BODY_COLOR = "#1A2A3A";
const LIGHT = "#6B7A8D";

export async function buildReport(
  draft: AIDraft,
  companyName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 60, bottom: 60, left: 72, right: 72 },
      info: {
        Title: `${companyName} — Series A Investor Report`,
        Author: "CFO Pitch Advisor",
        Subject: "Series A Fundraising Report",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 144; // usable width

    // ── Cover page ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);

    doc
      .fillColor(ACCENT)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("SERIES A INVESTOR REPORT", 72, 180, { width: W, align: "center" });

    doc
      .fillColor("#FFFFFF")
      .fontSize(36)
      .font("Helvetica-Bold")
      .text(companyName, 72, 210, { width: W, align: "center" });

    doc
      .fillColor(LIGHT)
      .fontSize(13)
      .font("Helvetica")
      .text("Prepared by CFO Pitch Advisor", 72, 270, { width: W, align: "center" });

    doc
      .fillColor(LIGHT)
      .fontSize(11)
      .text(
        new Date(draft.generatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        72,
        295,
        { width: W, align: "center" }
      );

    // Accent bar at bottom of cover
    doc.rect(72, doc.page.height - 100, W, 2).fill(ACCENT);

    doc
      .fillColor(LIGHT)
      .fontSize(9)
      .text("CONFIDENTIAL — FOR AUTHORIZED RECIPIENTS ONLY", 72, doc.page.height - 85, {
        width: W,
        align: "center",
      });

    // ── Report sections ──────────────────────────────────────────────────────
    let pageNum = 1;
    for (const section of draft.reportSections) {
      doc.addPage();
      pageNum++;

      // Section heading
      doc
        .fillColor(NAVY)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(section.heading, { width: W });

      // Underline
      doc
        .moveTo(72, doc.y + 4)
        .lineTo(72 + W, doc.y + 4)
        .strokeColor(ACCENT)
        .lineWidth(1.5)
        .stroke();

      doc.moveDown(0.8);

      // Body — split on double-newline to handle paragraphs
      const paragraphs = section.body
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      for (const para of paragraphs) {
        doc
          .fillColor(BODY_COLOR)
          .fontSize(11)
          .font("Helvetica")
          .text(para, { width: W, align: "justify", lineGap: 2 });
        doc.moveDown(0.7);
      }

      // Page number footer
      addPageFooter(doc, companyName, pageNum);
    }

    doc.end();
  });
}

function addPageFooter(doc: PDFKit.PDFDocument, companyName: string, pageNum: number): void {
  const bottom = doc.page.height - 40;
  doc
    .moveTo(72, bottom)
    .lineTo(doc.page.width - 72, bottom)
    .strokeColor(LIGHT)
    .lineWidth(0.5)
    .stroke();

  doc
    .fillColor(LIGHT)
    .fontSize(8)
    .font("Helvetica")
    .text(
      `${companyName} — Series A Investor Report · Confidential`,
      72,
      bottom + 6,
      { width: doc.page.width - 144, align: "left" }
    );

  doc.text(`Page ${pageNum}`, 72, bottom + 6, {
    width: doc.page.width - 144,
    align: "right",
  });
}
