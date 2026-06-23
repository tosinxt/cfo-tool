import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { buildDeck } from "@/lib/pptx/buildDeck";
import { buildReport } from "@/lib/pdf/buildReport";
import type { Engagement } from "@/lib/types";
import type { AIDraft } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifyAdminForApi(req.headers.get("cookie"));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: engagementId } = params;
  const type = req.nextUrl.searchParams.get("type");

  if (type !== "deck" && type !== "report") {
    return NextResponse.json({ error: "type must be deck or report" }, { status: 400 });
  }

  const docSnap = await adminDb.collection("engagements").doc(engagementId).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement & {
    aiDraft?: AIDraft;
  };

  if (!engagement.aiDraft) {
    return NextResponse.json({ error: "File not yet generated" }, { status: 404 });
  }

  const draft: AIDraft = {
    ...engagement.aiDraft,
    deckOutline: engagement.cfoEdits?.deckOutline ?? engagement.aiDraft.deckOutline,
    reportSections: engagement.cfoEdits?.reportSections ?? engagement.aiDraft.reportSections,
    design: engagement.cfoEdits?.design ?? engagement.aiDraft.design,
  };

  const companyName = engagement.intake?.companyName ?? engagement.clientName ?? "Company";
  const safeName = companyName.replace(/[^a-z0-9]+/gi, "_");

  try {
    if (type === "deck") {
      const pptxBuffer = await buildDeck(draft, companyName);
      return new NextResponse(new Uint8Array(pptxBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${safeName}_pitch_deck.pptx"`,
        },
      });
    }

    const pdfBuffer = await buildReport(draft, companyName);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_investor_report.pdf"`,
      },
    });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[admin-download] build failed for ${engagementId} (${type}): ${message}`);
    Sentry.captureException(err, { tags: { route: "admin-download" }, extra: { engagementId, type } });
    return NextResponse.json({ error: "Failed to generate file" }, { status: 500 });
  }
}
