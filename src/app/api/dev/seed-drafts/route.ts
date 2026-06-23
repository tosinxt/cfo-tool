import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const SEED_COMPANIES = [
  {
    clientName: "Sarah Chen",
    clientEmail: "founder@acme.io",
    companyName: "Acme AI",
    oneLiner: "We help ops teams automate SOC 2 compliance without hiring a dedicated security team.",
    sector: "SaaS / Compliance Tech",
    stage: "series-a" as const,
    problem: "Mid-market SaaS companies spend 6–12 months and $200K+ on SOC 2 certification, mostly on manual evidence collection and auditor back-and-forth.",
    solution: "Acme AI continuously monitors 200+ controls, auto-collects evidence from your stack, and generates audit-ready reports in hours instead of months.",
    marketSize: "$18B TAM (GRC software), $4.2B SAM (cloud-native compliance tools), growing 22% YoY",
    keyMetrics: "480 paying customers · $3.2M ARR · 118% NRR · avg deal size $6,700 ACV",
    growthRate: "12% MoM for the last 8 months",
    notableCustomers: "Retool, Drata, a Fortune 500 healthcare company (NDA)",
    teamMembers: [
      { name: "Sarah Chen", role: "CEO & Co-Founder", bio: "Ex-Stripe (led compliance eng), Stanford CS." },
      { name: "Marcus Webb", role: "CTO & Co-Founder", bio: "Ex-Google Security, 2 prior exits." },
    ],
    currentRevenue: "$3.2M ARR",
    burnRate: "$280K/month",
    runway: "18 months",
    threeYearProjections: "Year 1: $8M ARR · Year 2: $22M ARR · Year 3: $52M ARR",
    raiseAmount: "$12M Series A",
    valuationExpectation: "$60M pre-money",
    useOfFunds: "45% product & engineering · 35% go-to-market · 20% ops & infra",
    currentInvestors: "Y Combinator W22 · Sequoia Scout",
  },
  {
    clientName: "Daniela Reyes",
    clientEmail: "founder@orbitfreight.io",
    companyName: "OrbitFreight",
    oneLiner: "Real-time freight matching and dynamic pricing for mid-size logistics brokers.",
    sector: "Logistics / Supply Chain Tech",
    stage: "series-a" as const,
    problem: "Mid-size freight brokers lose 15-20% margin to manual load matching and stale spot-rate pricing, while large carriers automate this already.",
    solution: "OrbitFreight's matching engine and dynamic pricing API plug into existing TMS systems, cutting load-matching time from hours to minutes.",
    marketSize: "$22B TAM (US freight brokerage software), $5B SAM (mid-size broker segment), growing 14% YoY",
    keyMetrics: "62 broker customers · $1.8M ARR · 109% NRR · avg deal size $29K ACV",
    growthRate: "18% MoM for the last 6 months",
    notableCustomers: "Two regional carriers in the top-50 US freight broker list (NDA)",
    teamMembers: [
      { name: "Daniela Reyes", role: "CEO & Co-Founder", bio: "Ex-Convoy ops lead, 8 years in freight tech." },
      { name: "Tom Liu", role: "CTO & Co-Founder", bio: "Ex-Flexport eng, built real-time pricing infra." },
    ],
    currentRevenue: "$1.8M ARR",
    burnRate: "$150K/month",
    runway: "22 months",
    threeYearProjections: "Year 1: $5M ARR · Year 2: $14M ARR · Year 3: $34M ARR",
    raiseAmount: "$9M Series A",
    valuationExpectation: "$42M pre-money",
    useOfFunds: "50% engineering · 30% sales · 20% data/ops",
    currentInvestors: "Founders Fund Scout · 2 logistics-focused angels",
  },
];

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const results = [];

  for (const company of SEED_COMPANIES) {
    const intakeToken = randomBytes(32).toString("hex");
    const docRef = adminDb.collection("engagements").doc();

    await docRef.set({
      id: docRef.id,
      clientEmail: company.clientEmail,
      clientName: company.clientName,
      status: "drafting",
      stripeSessionId: "seed_dev",
      pricePaid: 0,
      intakeToken,
      paidAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      intakeSubmittedAt: FieldValue.serverTimestamp(),
      intake: {
        companyName: company.companyName,
        oneLiner: company.oneLiner,
        sector: company.sector,
        stage: company.stage,
        problem: company.problem,
        solution: company.solution,
        marketSize: company.marketSize,
        keyMetrics: company.keyMetrics,
        growthRate: company.growthRate,
        notableCustomers: company.notableCustomers,
        teamMembers: company.teamMembers,
        currentRevenue: company.currentRevenue,
        burnRate: company.burnRate,
        runway: company.runway,
        threeYearProjections: company.threeYearProjections,
        raiseAmount: company.raiseAmount,
        valuationExpectation: company.valuationExpectation,
        useOfFunds: company.useOfFunds,
        currentInvestors: company.currentInvestors,
        submittedAt: FieldValue.serverTimestamp(),
      },
    });

    // Fire-and-forget the real multi-stage pipeline, same as intake/submit does.
    fetch(`${appUrl}/api/ai/generate-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET ?? "",
      },
      body: JSON.stringify({ engagementId: docRef.id }),
    }).catch(() => {});

    results.push({
      engagementId: docRef.id,
      companyName: company.companyName,
      deckUrl: `${appUrl}/deck/${docRef.id}?token=${intakeToken}`,
    });
  }

  return NextResponse.json({ success: true, drafts: results });
}
