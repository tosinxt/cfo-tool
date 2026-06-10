/**
 * Demo mode — set DEMO_MODE=true in .env.local to bypass Stripe, auth,
 * token validation, emails, and AI generation. For UI development only.
 */
export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const DEMO_MODE_PUBLIC = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_ENGAGEMENT_ID = "demo-engagement-001";
export const DEMO_TOKEN = "demo-token-insecure";

export const DEMO_ACTOR = { uid: "demo-admin-uid", email: "demo@admin.local" };

export const DEMO_ENGAGEMENT = {
  id: DEMO_ENGAGEMENT_ID,
  clientEmail: "founder@acme.io",
  clientName: "Sarah Chen",
  status: "ready_for_review" as const,
  stripeSessionId: "cs_demo",
  pricePaid: 299700,
  intakeToken: DEMO_TOKEN,
  paidAt: { seconds: Math.floor(Date.now() / 1000) - 86400, nanoseconds: 0 },
  createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400, nanoseconds: 0 },
  updatedAt: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 },
  intake: {
    companyName: "Acme AI",
    oneLiner: "We help ops teams automate SOC 2 compliance without hiring a dedicated security team.",
    sector: "SaaS / Compliance Tech",
    stage: "series-a",
    problem: "Mid-market SaaS companies spend 6–12 months and $200K+ on SOC 2 certification, mostly on manual evidence collection and auditor back-and-forth.",
    solution: "Acme AI continuously monitors 200+ controls, auto-collects evidence from your stack, and generates audit-ready reports in hours instead of months.",
    marketSize: "$18B TAM (GRC software), $4.2B SAM (cloud-native compliance tools), growing 22% YoY",
    keyMetrics: "480 paying customers · $3.2M ARR · 118% NRR · avg deal size $6,700 ACV",
    growthRate: "12% MoM for the last 8 months",
    notableCustomers: "Retool, Drata, a Fortune 500 healthcare company (NDA)",
    teamMembers: [
      { name: "Sarah Chen", role: "CEO & Co-Founder", bio: "Ex-Stripe (led compliance eng), Stanford CS. Built Stripe's internal SOC 2 tooling used by 4,000+ merchants." },
      { name: "Marcus Webb", role: "CTO & Co-Founder", bio: "Ex-Google Security, 2 prior exits (Lacework acquired by Fortinet). Author of 3 IETF drafts on cloud identity." },
      { name: "Priya Nair", role: "VP Sales", bio: "Scaled Vanta from $2M to $30M ARR as first sales hire. 12 years enterprise SaaS." },
    ],
    currentRevenue: "$3.2M ARR",
    burnRate: "$280K/month",
    runway: "18 months",
    threeYearProjections: "Year 1: $8M ARR · Year 2: $22M ARR · Year 3: $52M ARR (assumes 2 new verticals: healthcare, fintech)",
    raiseAmount: "$12M Series A",
    valuationExpectation: "$60M pre-money",
    useOfFunds: "45% product & engineering (6 new hires) · 35% go-to-market (double sales team) · 20% ops & infra",
    currentInvestors: "Y Combinator W22 · Sequoia Scout · 3 angels from Okta and Vanta founding teams",
    submittedAt: { seconds: Math.floor(Date.now() / 1000) - 7200, nanoseconds: 0 },
  },
  aiDraft: {
    deckOutline: [
      { slideType: "title", title: "Acme AI", bullets: ["Automated SOC 2 compliance for fast-growing SaaS", "$12M Series A · June 2025"], speakerNotes: "Hook: compliance is the last manual bottleneck in modern SaaS ops." },
      { slideType: "problem", title: "SOC 2 is broken", bullets: ["6–12 months, $200K+ for a manual audit process", "80% of time is evidence collection, not actual security", "Mid-market companies deprioritise compliance until a big deal is on the line"], speakerNotes: "Use the Retool story — lost a $500K deal due to 9-month SOC 2 delay." },
      { slideType: "solution", title: "Continuous, automated compliance", bullets: ["200+ controls monitored 24/7 across AWS, GCP, GitHub, Okta", "Evidence auto-collected and audit-ready in hours", "AI-generated gap analysis flags issues before auditors do"], speakerNotes: "Demo the dashboard — show how 3 clicks replaces 200 hours of spreadsheet work." },
      { slideType: "market", title: "$18B market, still early", bullets: ["$18B GRC software TAM · $4.2B SAM (cloud-native)", "22% YoY CAGR driven by SEC cyber disclosure rules", "Only 12% of mid-market SaaS companies are currently SOC 2 certified"], speakerNotes: "Regulatory tailwind is the key unlock — new SEC rules mean every public co's vendors need SOC 2." },
      { slideType: "traction", title: "Strong signal, fast growth", bullets: ["480 customers · $3.2M ARR · 118% NRR", "12% MoM growth over 8 months", "$0 paid acquisition — all PLG and inbound"], speakerNotes: "NRR above 115% is the headline — it means existing customers are expanding." },
      { slideType: "team", title: "Built to win this market", bullets: ["Sarah Chen — ex-Stripe compliance eng, built internal SOC 2 tooling", "Marcus Webb — ex-Google Security, 2 exits, 3 IETF drafts", "Priya Nair — first sales hire at Vanta, $2M→$30M ARR"], speakerNotes: "We are the only team that has been on both the vendor and auditor side of this problem." },
      { slideType: "financials", title: "Unit economics", bullets: ["CAC: $1,200 · LTV: $28,000 · LTV/CAC: 23x", "Gross margin: 78%", "Payback period: 5.1 months"], speakerNotes: "Comparable to Vanta pre-Series B. Margin expansion expected as AI reduces support load." },
      { slideType: "ask", title: "The raise", bullets: ["$12M Series A at $60M pre-money", "Use of funds: 45% eng, 35% GTM, 20% ops", "Target: $22M ARR in 24 months, Series B ready"], speakerNotes: "We have $4M in commitments from existing angels. Looking for a lead at $6–8M." },
    ],
    reportSections: [
      { heading: "Executive Summary", body: "Acme AI is a cloud-native compliance automation platform that reduces SOC 2 certification time from 9 months to under 2 weeks for mid-market SaaS companies. With $3.2M ARR, 118% NRR, and 12% MoM growth over 8 months, the company has demonstrated strong product-market fit in an $18B market experiencing regulatory-driven acceleration." },
      { heading: "Market Opportunity", body: "The global GRC software market is valued at $18B and growing at 22% YoY. New SEC cyber disclosure rules and an expanding digital supply chain mean that SOC 2 certification has shifted from 'nice to have' to a sales prerequisite for mid-market SaaS. Only 12% of target companies are currently certified, representing a large greenfield opportunity." },
      { heading: "Competitive Landscape", body: "Vanta (Series C, ~$150M ARR) and Drata dominate the enterprise segment but have moved upmarket, leaving mid-market underserved. Acme AI differentiates on price ($6.7K ACV vs $30K+), implementation speed (2 weeks vs 3 months), and AI-driven gap analysis. Switching costs are high once a compliance program is running on the platform." },
      { heading: "Financial Analysis", body: "At $3.2M ARR with a $280K/month burn rate, Acme has 18 months of runway. LTV/CAC of 23x and 78% gross margins are best-in-class for the segment. The $12M raise will extend runway to 30 months and fund the GTM expansion required to reach $22M ARR." },
      { heading: "Risks & Mitigations", body: "Key risks: (1) Vanta re-enters mid-market — mitigated by depth of integration and switching costs. (2) Audit standards change — mitigated by active AICPA working group participation. (3) Sales cycle lengthens in downturn — mitigated by PLG motion that reduces reliance on top-down enterprise sales." },
      { heading: "Recommendation", body: "Acme AI presents a compelling Series A investment opportunity. The combination of strong NRR, low CAC, and a regulatory tailwind creates a defensible growth engine. We recommend proceeding to partner meeting. Key diligence items: customer reference calls with 3 Fortune 1000 accounts, review of auditor partnership agreements, and financial model stress-test at 50% growth reduction." },
    ],
  },
  cfoEdits: null,
  files: {
    deckUrl: "",
    deckPath: "",
    reportUrl: "",
    reportPath: "",
  },
  events: [],
};
