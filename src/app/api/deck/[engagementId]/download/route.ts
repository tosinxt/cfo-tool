import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import type { Engagement } from "@/lib/types";

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

  if (engagement.intakeToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const storagePath = engagement.files?.deckPath;
  const deckUrl = engagement.files?.deckUrl;

  if (!storagePath && !deckUrl) {
    return NextResponse.json({ error: "Deck not yet generated" }, { status: 404 });
  }

  // If we have a direct URL (e.g. manually uploaded), redirect to it
  if (deckUrl && !storagePath) {
    return NextResponse.redirect(deckUrl);
  }

  const [signedUrl] = await adminStorage
    .bucket()
    .file(storagePath!)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15-minute window
    });

  return NextResponse.redirect(signedUrl);
}
