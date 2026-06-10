import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import type { DeckSlide } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let actor: { uid: string; email: string };
  try {
    actor = await verifyAdminForApi(req.headers.get("cookie"));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: engagementId } = params;
  let deckOutline: DeckSlide[];
  try {
    const body = await req.json();
    deckOutline = body?.deckOutline;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(deckOutline)) {
    return NextResponse.json({ error: "deckOutline array required" }, { status: 400 });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await docRef.update({
    "cfoEdits.deckOutline": deckOutline,
    "cfoEdits.editedBy": actor.email,
    "cfoEdits.editedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendEvent(
    engagementId,
    "deck_edit",
    actor.uid,
    actor.email,
    "Admin saved deck edits",
    { slideCount: deckOutline.length }
  );

  return NextResponse.json({ ok: true });
}
