import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminDb } from "@/lib/firebase/admin";
import { buildDeck } from "@/lib/pptx/buildDeck";
import type { Engagement } from "@/lib/types";
import type { AIDraft } from "@/lib/ai/types";
import { canCustomerSeeDeck } from "@/lib/intake/gate";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { engagementId: string } }
) {
  const { engagementId } = params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const docSnap = await adminDb.collection("engagements").doc(engagementId).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement & {
    aiDraft?: AIDraft;
  };

  if (!intakeTokenMatches(engagement.intakeToken, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Every deck goes to the CFO before the customer sees it — an approved
  // status is the gate, not merely the existence of an AI draft.
  if (!canCustomerSeeDeck(engagement.status)) {
    return NextResponse.json(
      { error: "Your deck is still under CFO review." },
      { status: 403 }
    );
  }

  if (!engagement.aiDraft) {
    return NextResponse.json({ error: "Deck not yet generated" }, { status: 404 });
  }

  const draft: AIDraft = {
    ...engagement.aiDraft,
    deckOutline: engagement.cfoEdits?.deckOutline ?? engagement.aiDraft.deckOutline,
    design: engagement.cfoEdits?.design ?? engagement.aiDraft.design,
  };

  const companyName = engagement.intake?.companyName ?? engagement.clientName ?? "Company";

  try {
    const pptxBuffer = await buildDeck(draft, companyName);
    return new NextResponse(new Uint8Array(pptxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${companyName.replace(/[^a-z0-9]+/gi, "_")}_pitch_deck.pptx"`,
      },
    });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[deck-download] build failed for ${engagementId}: ${message}`);
    Sentry.captureException(err, { tags: { route: "deck-download" }, extra: { engagementId } });
    return NextResponse.json({ error: "Failed to generate deck" }, { status: 500 });
  }
}
