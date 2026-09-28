import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Engagement } from "@/lib/types";
import type { DeckSlide } from "@/lib/ai/types";
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

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement;

  if (!intakeTokenMatches(engagement.intakeToken, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Pre-approval the client gets progress only. Leaking slideCount would
  // reveal that an unreviewed draft exists and let the viewer offer content.
  if (!canCustomerSeeDeck(engagement.status)) {
    return NextResponse.json({
      status: engagement.status,
      draftProgress: engagement.draftProgress ?? null,
      slideCount: 0,
      hasDeckFile: false,
    });
  }

  const slides: DeckSlide[] =
    (engagement.cfoEdits?.deckOutline as DeckSlide[] | undefined) ??
    (engagement.aiDraft?.deckOutline as DeckSlide[] | undefined) ??
    [];

  return NextResponse.json({
    status: engagement.status,
    draftProgress: engagement.draftProgress ?? null,
    slideCount: slides.length,
    hasDeckFile: !!engagement.aiDraft,
  });
}
