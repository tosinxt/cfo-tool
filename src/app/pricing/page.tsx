"use client";

import { useState, useEffect } from "react";
import { CalderaNav } from "@/components/caldera/nav";
import { CalderaFooter } from "@/components/caldera/footer";
import { CalderaCTA } from "@/components/caldera/cta";

/* ── Data ─────────────────────────────────────────────────────────── */

const INCLUSIONS = [
  {
    category: "Pitch Deck",
    badge: "~12–16 slides",
    items: [
      "Sequoia-style narrative arc across all slides",
      "Problem, solution, market, traction, team, financials, ask",
      "Slide-by-slide speaker notes included",
      "Sector-specific framing and competitive positioning",
      "Delivered as editable .pptx",
    ],
  },
  {
    category: "Written Report",
    badge: "10–20 pages",
    items: [
      "Long-form investment thesis narrative",
      "Full market sizing with TAM / SAM / SOM breakdown",
      "Traction timeline and unit economics section",
      "Team and founder story chapter",
      "Use of funds and milestones breakdown",
    ],
  },
  {
    category: "CFO Review",
    badge: "Every engagement",
    items: [
      "Every number and projection independently stress-tested",
      "Revenue model reviewed for coherence and credibility",
      "Burn rate and runway verified against your numbers",
      "Valuation framing reviewed for your sector and stage",
      "Story arc sharpened by a CFO with Series A experience",
    ],
  },
];

const COMPARISON = [
  {
    feature: "Price",
    us: "$2,997",
    bank: "$15k – $50k",
    freelancer: "$5k – $15k",
  },
  {
    feature: "Timeline",
    us: "5–7 business days",
    bank: "6–12 weeks",
    freelancer: "3–6 weeks",
  },
  {
    feature: "CFO review",
    us: true,
    bank: true,
    freelancer: "Sometimes",
  },
  {
    feature: "Written investment report",
    us: true,
    bank: "Rarely",
    freelancer: "Sometimes",
  },
  {
    feature: "Revision round included",
    us: true,
    bank: true,
    freelancer: "Sometimes",
  },
  {
    feature: "No account or retainer",
    us: true,
    bank: false,
    freelancer: false,
  },
];

const FAQS = [
  {
    q: "What do I need to provide?",
    a: "You complete a structured intake form — about 30 minutes. It covers your company snapshot, problem and solution, market size, traction and KPIs, team bios, current financials, and raise details. No calls required. We work from what you submit.",
  },
  {
    q: "How long does it take?",
    a: "5–7 business days from intake submission to delivery. Your deck and report arrive together as a single handoff — pitch deck (.pptx), written investment report (.pdf), and a summary of CFO notes.",
  },
  {
    q: "What if I'm not happy with the output?",
    a: "One round of revisions is included. If there are sections that don't reflect your business accurately, or framing that feels off, we revise. We want a deck you're confident putting in front of investors.",
  },
  {
    q: "Is this right for my stage?",
    a: "PitchReady is built for founders raising a Series A — typically $5M–$20M. If you're pre-seed or seed-stage, the frameworks still apply, but the CFO review will be calibrated for your actual traction and metrics.",
  },
  {
    q: "How does payment work?",
    a: "You pay upfront via Stripe. Once payment clears, you receive a link to the intake form. Your engagement is yours — no subscription, no ongoing fees.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes. We handle sensitive financial and strategic information for every client. We can sign your standard NDA before you complete the intake, or you can use ours.",
  },
];

const PROOF_STATS = [
  { label: "Decks delivered", value: "80+" },
  { label: "Capital raised by clients", value: "$200M+" },
  { label: "Average raise size", value: "$8M" },
  { label: "Days to delivery", value: "5–7" },
];

/* ── FAQ Accordion ────────────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid var(--color-sage)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        style={{ fontFamily: "var(--font-af)", background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-[15px] font-[500] leading-[1.4] tracking-[-0.15px]"
          style={{ color: "var(--color-ink)" }}
        >
          {q}
        </span>
        <span
          className="shrink-0 text-[20px] leading-none"
          style={{
            color: "var(--color-fog)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            display: "inline-block",
            transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          +
        </span>
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 260ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p
            className="pb-5 text-[14px] font-[400] leading-[1.7] tracking-[-0.14px]"
            style={{ color: "var(--color-steel)", fontFamily: "var(--font-af)", maxWidth: "560px" }}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Check / Cross icons ──────────────────────────────────────────── */

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="7.5" stroke="rgba(0,129,192,0.2)" />
      <path d="M5 8l2.5 2.5L11 5.5" stroke="var(--color-hudson-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="7.5" stroke="var(--color-sage)" />
      <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="var(--color-fog)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Maybe({ label }: { label: string }) {
  return (
    <span className="text-[13px]" style={{ color: "var(--color-fog)", fontFamily: "var(--font-af)" }}>
      {label}
    </span>
  );
}

function CellValue({ v }: { v: boolean | string }) {
  if (v === true) return <Check />;
  if (v === false) return <Cross />;
  return <Maybe label={v} />;
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  async function handleGetStarted() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const fade = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0px)" : "translateY(20px)",
    transition: `opacity 420ms ease ${delay}ms, transform 420ms ease ${delay}ms`,
  });

  return (
    <main
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--color-cream)", fontFamily: "var(--font-af)" }}
    >
      {/* Hero background — clear image, only bottom edge blurs into cream */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100vh]" aria-hidden>
        <img
          src="/hero.png"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        {/* Dark scrim over text area for contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 55%, transparent 80%)",
          }}
        />
        {/* Bottom blur — blurs the image at the edge so it doesn't cut off hard */}
        <div
          className="absolute inset-x-0 bottom-0 h-[180px]"
          style={{
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 55%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 55%)",
          }}
        />
        {/* Fade the blurred edge into cream */}
        <div
          className="absolute inset-x-0 bottom-0 h-[100px]"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, var(--color-cream) 100%)",
          }}
        />
      </div>

      <CalderaNav />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-10 pt-28 sm:px-8 sm:pt-32 lg:pt-36">
        <div className="mx-auto max-w-[640px] text-center" style={fade(0)}>
          <span
            className="mb-5 inline-block rounded-[50px] px-3 py-1 text-[11px] font-[600] uppercase tracking-[0.14em]"
            style={{
              fontFamily: "var(--font-af)",
              color: "rgba(0,210,255,1)",
              background: "rgba(0,174,239,0.18)",
              border: "1px solid rgba(0,174,239,0.45)",
            }}
          >
            Pricing
          </span>

          <h1
            className="mb-5 text-[40px] font-[400] leading-[1.08] tracking-[-0.8px] sm:text-[52px] sm:tracking-[-1.04px]"
            style={{
              fontFamily: "var(--font-ppmondwest)",
              fontFeatureSettings: '"liga" 0',
              color: "white",
            }}
          >
            One engagement.
            <br />
            Everything you need.
          </h1>

          <p
            className="mb-6 text-[15px] font-[400] leading-[1.65] tracking-[-0.15px]"
            style={{ color: "rgba(255,255,255,0.82)", maxWidth: "420px", margin: "0 auto 24px" }}
          >
            A single flat fee covers your pitch deck, written report, and CFO review.
            No subscriptions, no surprises.
          </p>

          {/* Context anchor */}
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-[50px] px-4 py-2"
            style={{
              background: "rgba(10,10,20,0.40)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span className="text-[12px] font-[400]" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-af)" }}>
              Boutique banks charge <span style={{ color: "white", fontWeight: 500 }}>$15k–$50k</span> for the same work.
            </span>
          </div>
        </div>
      </section>

      {/* ── Pricing card ──────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-8" style={fade(100)}>
        <div
          className="relative mx-auto max-w-[860px] overflow-hidden rounded-[16px]"
          style={{
            background: "var(--color-paper)",
            border: "1px solid var(--color-sage)",
            boxShadow: "var(--shadow-subtle-2)",
          }}
        >
          {/* Top band */}
          <div
            className="flex flex-col gap-6 px-8 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-12 sm:py-12"
            style={{ borderBottom: "1px solid var(--color-sage)" }}
          >
            <div className="flex flex-col gap-3">
              <span
                className="text-[11px] font-[600] uppercase tracking-[0.14em]"
                style={{ fontFamily: "var(--font-af)", color: "var(--color-fog)" }}
              >
                Series A Engagement
              </span>

              <div className="flex items-baseline gap-3">
                <span
                  className="text-[56px] font-[400] leading-[1] tracking-[-1.12px] sm:text-[64px]"
                  style={{
                    fontFamily: "var(--font-ppmondwest)",
                    fontFeatureSettings: '"liga" 0',
                    color: "var(--color-ink)",
                  }}
                >
                  $2,997
                </span>
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[12px] font-[500]"
                    style={{ color: "var(--color-hudson-blue)", fontFamily: "var(--font-af)" }}
                  >
                    USD · one-time
                  </span>
                  <span
                    className="text-[11px] font-[400]"
                    style={{ color: "var(--color-fog)", fontFamily: "var(--font-af)" }}
                  >
                    vs. $15–50k at a boutique bank
                  </span>
                </div>
              </div>

              <p
                className="text-[14px] font-[400] leading-[1.6]"
                style={{ color: "var(--color-steel)", maxWidth: "380px", fontFamily: "var(--font-af)" }}
              >
                Pitch deck, investment report, and CFO review — delivered together in 5–7 business days.
              </p>
            </div>

            {/* CTA block */}
            <div className="flex flex-col gap-3 sm:items-end">
              <button
                onClick={handleGetStarted}
                disabled={loading}
                className="gic-spring rounded-[4px] px-6 py-3 text-[15px] font-[500] disabled:opacity-50"
                style={{
                  background: "var(--color-obsidian)",
                  color: "var(--color-paper)",
                  border: "none",
                  cursor: loading ? "default" : "pointer",
                  fontFamily: "var(--font-af)",
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "Loading…" : "Get your pitch deck →"}
              </button>
              <span
                className="text-[12px] font-[400]"
                style={{ color: "var(--color-fog)", fontFamily: "var(--font-af)" }}
              >
                Pay once. Intake link sent immediately.
              </span>
              {error && (
                <p className="text-[12px]" style={{ color: "var(--color-slate-cyan)" }}>
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* What's included grid — columns only carry the border, no double */}
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {INCLUSIONS.map((block, bi) => (
              <div
                key={block.category}
                className="flex flex-col gap-5 px-8 py-8 sm:px-10 sm:py-10"
                style={{
                  borderTop: "1px solid var(--color-sage)",
                  borderLeft: bi > 0 ? "1px solid var(--color-sage)" : "none",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-[13px] font-[600] tracking-[-0.13px]"
                    style={{ color: "var(--color-ink)", fontFamily: "var(--font-af)" }}
                  >
                    {block.category}
                  </span>
                  <span
                    className="rounded-[50px] px-2.5 py-0.5 text-[11px] font-[500]"
                    style={{
                      fontFamily: "var(--font-af)",
                      color: "var(--color-hudson-blue)",
                      background: "rgba(0,129,192,0.07)",
                      border: "1px solid rgba(0,129,192,0.14)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {block.badge}
                  </span>
                </div>

                <ul className="flex flex-col" style={{ borderTop: "1px solid var(--color-sage)" }}>
                  {block.items.map((item) => (
                    <li
                      key={item}
                      className="gic-row-hover flex items-start gap-3 rounded-[4px] py-3"
                      style={{ borderBottom: "1px solid var(--color-sage)" }}
                    >
                      <svg className="mt-[3px] shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--color-hudson-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span
                        className="text-[13px] font-[400] leading-[1.55]"
                        style={{ color: "var(--color-iron)", fontFamily: "var(--font-af)" }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer trust strip */}
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-3 px-8 py-5 sm:px-12"
            style={{ borderTop: "1px solid var(--color-sage)", background: "var(--color-linen)" }}
          >
            {[
              "One round of revisions included",
              "NDA available on request",
              "Secure payment via Stripe",
            ].map((note) => (
              <span
                key={note}
                className="flex items-center gap-2 text-[12px] font-[400]"
                style={{ color: "var(--color-steel)", fontFamily: "var(--font-af)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--color-hudson-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {note}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison table ──────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-8" style={fade(180)}>
        <div className="mx-auto max-w-[860px]">
          {/* Header */}
          <div
            className="mb-8 flex items-end justify-between pb-6"
            style={{ borderBottom: "1px solid var(--color-sage)" }}
          >
            <h2
              className="text-[24px] font-[400] leading-[1.1] tracking-[-0.48px] sm:text-[28px] sm:tracking-[-0.56px]"
              style={{
                fontFamily: "var(--font-ppmondwest)",
                fontFeatureSettings: '"liga" 0',
                color: "var(--color-ink)",
              }}
            >
              How we compare
            </h2>
          </div>

          {/* Table */}
          <div
            className="overflow-hidden rounded-[12px]"
            style={{ border: "1px solid var(--color-sage)" }}
          >
            {/* Column headers */}
            <div
              className="grid grid-cols-4"
              style={{ background: "var(--color-linen)", borderBottom: "1px solid var(--color-sage)" }}
            >
              <div className="px-5 py-4" />
              {[
                { label: "PitchReady", highlight: true },
                { label: "Boutique bank", highlight: false },
                { label: "Freelancer", highlight: false },
              ].map((col) => (
                <div
                  key={col.label}
                  className="px-5 py-4"
                  style={col.highlight ? { borderLeft: "1px solid rgba(0,129,192,0.2)", background: "rgba(0,129,192,0.04)" } : { borderLeft: "1px solid var(--color-sage)" }}
                >
                  <span
                    className="text-[12px] font-[600] tracking-[-0.12px]"
                    style={{
                      fontFamily: "var(--font-af)",
                      color: col.highlight ? "var(--color-hudson-blue)" : "var(--color-steel)",
                    }}
                  >
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {COMPARISON.map((row, ri) => (
              <div
                key={row.feature}
                className="gic-row-hover grid grid-cols-4"
                style={{
                  borderBottom: ri < COMPARISON.length - 1 ? "1px solid var(--color-sage)" : "none",
                  background: "var(--color-paper)",
                }}
              >
                {/* Feature label */}
                <div className="px-5 py-4">
                  <span
                    className="text-[13px] font-[400] leading-[1.4]"
                    style={{ color: "var(--color-steel)", fontFamily: "var(--font-af)" }}
                  >
                    {row.feature}
                  </span>
                </div>

                {/* PitchReady */}
                <div
                  className="flex items-center px-5 py-4"
                  style={{ borderLeft: "1px solid rgba(0,129,192,0.2)", background: "rgba(0,129,192,0.03)" }}
                >
                  {typeof row.us === "string" ? (
                    <span
                      className="text-[13px] font-[500]"
                      style={{ color: "var(--color-ink)", fontFamily: "var(--font-af)" }}
                    >
                      {row.us}
                    </span>
                  ) : (
                    <CellValue v={row.us} />
                  )}
                </div>

                {/* Boutique bank */}
                <div className="flex items-center px-5 py-4" style={{ borderLeft: "1px solid var(--color-sage)" }}>
                  <CellValue v={row.bank} />
                </div>

                {/* Freelancer */}
                <div className="flex items-center px-5 py-4" style={{ borderLeft: "1px solid var(--color-sage)" }}>
                  <CellValue v={row.freelancer} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof stats ───────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-24 sm:px-8" style={fade(240)}>
        <div
          className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-[12px] lg:grid-cols-4"
          style={{ background: "var(--color-sage)" }}
        >
          {PROOF_STATS.map((s) => (
            <div
              key={s.label}
              className="gic-stat-group gic-lift flex flex-col gap-2 bg-[var(--color-paper)] p-5 sm:p-6"
            >
              <span
                className="text-[12px] font-[400] leading-[1.4] tracking-[-0.1px]"
                style={{ color: "var(--color-steel)", fontFamily: "var(--font-af)" }}
              >
                {s.label}
              </span>
              <span
                className="gic-stat-number text-[32px] font-[400] leading-[1.1] tracking-[-0.64px] sm:text-[38px]"
                style={{
                  fontFamily: "var(--font-ppmondwest)",
                  fontFeatureSettings: '"liga" 0',
                  color: "var(--color-ink)",
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-32 sm:px-8" style={fade(300)}>
        <div className="mx-auto max-w-[720px]">
          <div
            className="mb-10 flex items-end justify-between pb-6"
            style={{ borderBottom: "1px solid var(--color-sage)" }}
          >
            <h2
              className="text-[28px] font-[400] leading-[1.1] tracking-[-0.56px] sm:text-[34px] sm:tracking-[-0.68px]"
              style={{
                fontFamily: "var(--font-ppmondwest)",
                fontFeatureSettings: '"liga" 0',
                color: "var(--color-ink)",
              }}
            >
              Common questions
            </h2>
            <span
              className="text-[12px] font-[400] tabular-nums"
              style={{ color: "var(--color-fog)", fontFamily: "var(--font-af)" }}
            >
              {FAQS.length} questions
            </span>
          </div>

          <div>
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <div className="pb-24" style={fade(360)}>
        <CalderaCTA onGetStarted={handleGetStarted} loading={loading} error={error} />
      </div>

      <CalderaFooter />
    </main>
  );
}
