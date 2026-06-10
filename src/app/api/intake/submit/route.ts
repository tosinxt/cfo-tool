import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendClientConfirmation, sendAdminNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID } from "@/lib/demo";
import { z } from "zod";

export const runtime = "nodejs";

const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
});

const bodySchema = z.object({
  engagementId: z.string().min(1),
  token: z.string().min(1),
  // Minimums match the client-side Zod schemas in schemas.ts
  companyName: z.string().min(1),
  oneLiner: z.string().min(10).max(200),
  sector: z.string().min(1),
  stage: z.enum(["pre-seed", "seed", "series-a", "series-b+"]),
  problem: z.string().min(20),
  solution: z.string().min(20),
  marketSize: z.string().min(5),
  keyMetrics: z.string().min(5),
  growthRate: z.string().min(1),
  notableCustomers: z.string(),
  teamMembers: z.array(teamMemberSchema).min(1).max(6),
  currentRevenue: z.string().min(1),
  burnRate: z.string().min(1),
  runway: z.string().min(1),
  threeYearProjections: z.string().min(10),
  raiseAmount: z.string().min(1),
  valuationExpectation: z.string().min(1),
  useOfFunds: z.string().min(20),
  currentInvestors: z.string(),
});

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit(req);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter ?? 3600) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { engagementId, token, ...intakeFields } = parsed.data;

  // Demo mode: skip all Firebase/email/AI work
  if (DEMO_MODE) {
    void token; void intakeFields;
    return NextResponse.json({ success: true });
  }

  const docRef = adminDb.collection("engagements").doc(engagementId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }

  const engagementData = docSnap.data()!;

  if (!DEMO_MODE) {
    // Constant-time comparison to prevent timing attacks
    const storedToken: string = engagementData.intakeToken ?? "";
    const storedBuf = Buffer.from(createHash("sha256").update(storedToken).digest("hex"));
    const suppliedBuf = Buffer.from(createHash("sha256").update(token).digest("hex"));
    const tokenValid =
      storedBuf.length === suppliedBuf.length &&
      timingSafeEqual(storedBuf, suppliedBuf);
    if (!tokenValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
  }

  // Idempotency guard
  if (engagementData.status !== "awaiting_intake") {
    return NextResponse.json({ success: true, alreadySubmitted: true });
  }

  await docRef.update({
    intake: {
      ...intakeFields,
      submittedAt: FieldValue.serverTimestamp(),
    },
    status: "drafting",
    intakeSubmittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (!DEMO_MODE) {
    // Fire emails — don't fail the request if they error
    await Promise.allSettled([
      sendClientConfirmation(engagementData.clientEmail, engagementId),
      sendAdminNotification(engagementId, intakeFields.companyName),
    ]);

    // Fire-and-forget AI draft generation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    fetch(`${appUrl}/api/ai/generate-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET ?? "",
      },
      body: JSON.stringify({ engagementId }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
