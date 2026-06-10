import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import type { Engagement } from "@/lib/types";

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

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement;
  const storagePath =
    type === "deck"
      ? engagement.files?.deckPath
      : engagement.files?.reportPath;

  if (!storagePath) {
    return NextResponse.json({ error: "File not yet generated" }, { status: 404 });
  }

  const [signedUrl] = await adminStorage
    .bucket()
    .file(storagePath)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15-minute window
    });

  return NextResponse.redirect(signedUrl);
}
