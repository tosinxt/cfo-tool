"use client";

import { useState } from "react";
import { SahShell, Reveal, CountUp, useCheckout } from "@/components/sah/shell";

/* ── Data ─────────────────────────────────────────────────────────── */

const INCLUSIONS = [
  {
    category: "Pitch deck",
    badge: "12–16 slides",
    items: [
      "Sequoia-style narrative arc across all slides",
      "Problem, solution, market, traction, team, financials, ask",
      "Slide-by-slide speaker notes included",
      "Sector-specific framing and competitive positioning",
      "Delivered as editable .pptx",
    ],
  },
  {
    category: "Written report",
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
    category: "CFO review",
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

const COMPARISON: { feature: string; us: string | boolean; bank: string | boolean; freelancer: string | boolean }[] = [
  { feature: "Price", us: "$2,997", bank: "$15k – $50k", freelancer: "$5k – $15k" },
  { feature: "Timeline", us: "5–7 business days", bank: "6–12 weeks", freelancer: "3–6 weeks" },
  { feature: "CFO review", us: true, bank: true, freelancer: "Sometimes" },
  { feature: "Written investment report", us: true, bank: "Rarely", freelancer: "Sometimes" },
  { feature: "Revision round included", us: true, bank: true, freelancer: "Sometimes" },
  { feature: "No account or retainer", us: true, bank: false, freelancer: false },
];

const FAQS = [
  {
    q: "What do I need to provide?",
    a: "You complete a structured intake — about 30 minutes, as a guided form or an AI interview. It covers your company snapshot, problem and solution, market size, traction and KPIs, team bios, current financials, and raise details. No calls required. We work from what you submit.",
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
    a: "Series A Hub is built for founders raising a Series A — typically $5M–$20M. If you're pre-seed or seed-stage, the frameworks still apply, but the CFO review will be calibrated for your actual traction and metrics.",
  },
  {
    q: "How does payment work?",
    a: "You pay upfront via Stripe. Once payment clears, you receive a link to the intake. Your engagement is yours — no subscription, no ongoing fees.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes. We handle sensitive financial and strategic information for every client. We can sign your standard NDA before you complete the intake, or you can use ours.",
  },
];

/* ── Small pieces ─────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-label="Included">
      <circle cx="7" cy="7" r="6.5" fill="rgba(0,56,101,.08)" />
      <path d="M4.2 7l2 2 3.6-4" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-label="Not included">
      <circle cx="7" cy="7" r="6.5" fill="rgba(111,122,133,.10)" />
      <path d="M4.8 9.2l4.4-4.4M9.2 9.2L4.8 4.8" stroke="var(--gray)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <CheckIcon />;
  if (v === false) return <CrossIcon />;
  return <>{v}</>;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <button type="button" className="faq-q" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {q}
        <span className="plus" aria-hidden="true">+</span>
      </button>
      <div className="faq-a">
        <div>
          <p>{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function PricingPage() {
  const { loading, error, start } = useCheckout();

  return (
    <SahShell active="pricing">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-mini">
          <span className="eyebrow fade-up" style={{ "--d": ".05s" } as React.CSSProperties}>Pricing</span>
          <h1 className="fade-up" style={{ "--d": ".15s" } as React.CSSProperties}>One engagement. Everything you need.</h1>
          <p className="lead fade-up" style={{ "--d": ".3s" } as React.CSSProperties}>
            A single flat fee covers your pitch deck, written report, and CFO review.
            No subscriptions, no surprises.
          </p>
          <div className="fade-up" style={{ "--d": ".42s" } as React.CSSProperties}>
            <span className="anchor-chip">
              Boutique banks charge <b>$15k–$50k</b> for the same work.
            </span>
          </div>
        </div>
      </section>

      {/* ── Price card ───────────────────────────────────────────── */}
      <section className="band-cream" style={{ paddingTop: "64px" }}>
        <div className="container">
          <Reveal>
            <div className="price-card">
              <div className="price-top">
                <div>
                  <div className="price-kicker">Series A engagement</div>
                  <div className="price-row">
                    <span className="price-n">$2,997</span>
                    <span className="price-meta">
                      <span className="a">USD · one-time</span>
                      <span className="b">vs. $15–50k at a boutique bank</span>
                    </span>
                  </div>
                  <p className="price-desc">
                    Pitch deck, investment report, and CFO review — delivered together in 5–7 business days.
                  </p>
                </div>
                <div className="price-cta">
                  <button type="button" className="btn btn-primary" onClick={start} disabled={loading}>
                    {loading ? "One moment…" : <>Get your pitch deck <span className="arr">→</span></>}
                  </button>
                  <span className="note">Pay once. Intake link sent immediately.</span>
                  {error && <div className="form-msg error" role="alert">{error}</div>}
                </div>
              </div>

              <div className="inclusions">
                {INCLUSIONS.map((block) => (
                  <div key={block.category} className="inclusion">
                    <div className="inclusion-head">
                      <span className="cat">{block.category}</span>
                      <span className="tag">{block.badge}</span>
                    </div>
                    <ul>
                      {block.items.map((item) => (
                        <li key={item}><CheckIcon />{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="trust-strip">
                {["One round of revisions included", "NDA available on request", "Secure payment via Stripe"].map((note) => (
                  <span key={note}><CheckIcon />{note}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────── */}
      <section className="band-cream" style={{ paddingTop: "40px" }}>
        <div className="container">
          <Reveal>
            <div className="section-head center">
              <span className="eyebrow">The alternatives</span>
              <h2>How we compare</h2>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="cmp-wrap">
              <div className="cmp">
                <div className="cmp-row cmp-head">
                  <div className="cmp-cell" />
                  <div className="cmp-cell us">Series A Hub</div>
                  <div className="cmp-cell">Boutique bank</div>
                  <div className="cmp-cell">Freelancer</div>
                </div>
                {COMPARISON.map((row) => (
                  <div key={row.feature} className="cmp-row">
                    <div className="cmp-cell" style={{ color: "var(--sah-ink)" }}>{row.feature}</div>
                    <div className="cmp-cell us"><Cell v={row.us} /></div>
                    <div className="cmp-cell"><Cell v={row.bank} /></div>
                    <div className="cmp-cell"><Cell v={row.freelancer} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Proof stats ──────────────────────────────────────────── */}
      <section className="band-navy">
        <div className="container">
          <Reveal>
            <div className="proof">
              <div><div className="n"><CountUp to={80} suffix="+" /></div><div className="l">Decks delivered</div></div>
              <div><div className="n"><CountUp to={200} prefix="$" suffix="M+" /></div><div className="l">Capital raised by clients</div></div>
              <div><div className="n"><CountUp to={8} prefix="$" suffix="M" /></div><div className="l">Average raise size</div></div>
              <div><div className="n">5–7</div><div className="l">Days to delivery</div></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="band-white">
        <div className="container">
          <Reveal>
            <div className="section-head center">
              <span className="eyebrow">Before you commit</span>
              <h2>Common questions</h2>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="faq">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="band-powder contact">
        <div className="container narrow">
          <Reveal>
            <span className="eyebrow">Ready when you are</span>
            <h2>Start your engagement today</h2>
            <p className="lead" style={{ color: "#1d3a52" }}>
              Pay once, complete the guided intake, and have an investor-ready deck in your inbox within 5–7 business days.
            </p>
            <button type="button" className="btn btn-primary" onClick={start} disabled={loading}>
              {loading ? "One moment…" : <>Get your pitch deck <span className="arr">→</span></>}
            </button>
            {error && <div className="form-msg error" role="alert" style={{ color: "#b3261e" }}>{error}</div>}
          </Reveal>
        </div>
      </section>
    </SahShell>
  );
}
