import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminForApi } from "@/lib/auth/verifyAdmin";
import { appendEvent } from "@/lib/firebase/appendEvent";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

export const runtime = "nodejs";

const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
});

const intakeSchema = z.object({
  companyName: z.string().min(1),
  oneLiner: z.string().min(1),
  sector: z.string().min(1),
  stage: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  marketSize: z.string().min(1),
  keyMetrics: z.string().min(1),
  growthRate: z.string().min(1),
  notableCustomers: z.string(),
  teamMembers: z.array(teamMemberSchema).min(1).max(6),
  currentRevenue: z.string().min(1),
  burnRate: z.string().min(1),
  runway: z.string().min(1),
  threeYearProjections: z.string().min(1),
  raiseAmount: z.string().min(1),
  valuationExpectation: z.string().min(1),
  useOfFunds: z.string().min(1),
  currentInvestors: z.string(),
});

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
  let rawIntake: unknown;
  let fieldsChanged: string[];
  try {
    const body = await req.json();
    rawIntake = body?.intake;
    fieldsChanged = body?.fieldsChanged ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(rawIntake);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid intake data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const intakeData = parsed.data;

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await docRef.update({
    intake: intakeData,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await appendEvent(
    engagementId,
    "intake_edit",
    actor.uid,
    actor.email,
    "Admin edited intake form",
    { fieldsChanged }
  );

  return NextResponse.json({ ok: true });
}
