import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import { THEME_IDS, type DesignSpec } from "@/lib/pptx/themes";

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
  let design: DesignSpec;
  try {
    const body = await req.json();
    design = {
      themeId: body?.themeId,
      financialsLayout: body?.financialsLayout,
      teamLayout: body?.teamLayout,
      rationale: "Chosen manually by admin",
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!THEME_IDS.includes(design.themeId)) {
    return NextResponse.json({ error: `themeId must be one of: ${THEME_IDS.join(", ")}` }, { status: 400 });
  }
  if (design.financialsLayout !== "cards" && design.financialsLayout !== "table") {
    return NextResponse.json({ error: "financialsLayout must be cards or table" }, { status: 400 });
  }
  if (design.teamLayout !== "grid" && design.teamLayout !== "list") {
    return NextResponse.json({ error: "teamLayout must be grid or list" }, { status: 400 });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await docRef.update({
    "cfoEdits.design": design,
    "cfoEdits.editedBy": actor.email,
    "cfoEdits.editedAt": FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendEvent(
    engagementId,
    "deck_edit",
    actor.uid,
    actor.email,
    "Admin chose deck design",
    { themeId: design.themeId, financialsLayout: design.financialsLayout, teamLayout: design.teamLayout }
  );

  return NextResponse.json({ ok: true });
}
