import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

export const runtime = "nodejs";

const CONFIG_DOC = "config/cfoSkill";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminForApi(req.headers.get("cookie"));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await adminDb.doc(CONFIG_DOC).get();
  const addendum = snap.exists ? ((snap.data() as { addendum?: string })?.addendum ?? "") : "";
  return NextResponse.json({ addendum });
}

const bodySchema = z.object({
  addendum: z.string().max(8000, "Addendum must be under 8000 characters"),
});

export async function POST(req: NextRequest) {
  try {
    await verifyAdminForApi(req.headers.get("cookie"));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await adminDb.doc(CONFIG_DOC).set(
    { addendum: parsed.data.addendum, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
