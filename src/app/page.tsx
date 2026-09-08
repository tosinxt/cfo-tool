"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SahShell, Reveal, CountUp, useCheckout, EASE } from "@/components/sah/shell";

/* ── Hero pieces ────────────────────────────────────────────────────────── */

function WordRise({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="w" style={{ "--i": i } as CSSProperties}>
          {w}{" "}
        </span>
      ))}
    </>
  );
}

/* ── Animated deck stack (decorative — the deck assembling itself) ─────── */

const DECK_POS = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
  { x: 30, y: 22, rotate: 2.5, scale: 0.96, opacity: 0.9 },
  { x: 60, y: 44, rotate: 5, scale: 0.92, opacity: 0.72 },
];

const BAR_HEIGHTS = [0.3, 0.38, 0.46, 0.58, 0.7, 0.84, 1];

function TractionSlide({ front }: { front: boolean }) {
  return (
    <>
      <div className="slide-label">Slide 05 · Traction</div>
      <div className="slide-title">Revenue growth</div>
      <div className="slide-bars">
        {BAR_HEIGHTS.map((h, i) => (
          <motion.span
            key={i}
            animate={{ scaleY: front ? h : h * 0.35 }}
            transition={{ delay: front ? 0.25 + i * 0.055 : 0, type: "spring", stiffness: 170, damping: 21 }}
            style={{ height: "100%" }}
          />
        ))}
      </div>
    </>
  );
}

function AskSlide({ front }: { front: boolean }) {
  return (
    <>
      <div className="slide-label">Slide 09 · The Ask</div>
      <div className="slide-title">Series A raise</div>
      <div className="slide-ask-n">$12M</div>
      <motion.div
        className="slide-track"
        animate={{ scaleX: front ? 1 : 0.4 }}
        transition={{ delay: front ? 0.3 : 0, type: "spring", stiffness: 130, damping: 20 }}
      >
        <i style={{ width: "45%", background: "var(--navy)" }} />
        <i style={{ width: "35%", background: "var(--accent-d)" }} />
        <i style={{ width: "20%", background: "var(--powder)" }} />
      </motion.div>
      <div className="slide-legend">
        <span><b style={{ background: "var(--navy)" }} />Product</span>
        <span><b style={{ background: "var(--accent-d)" }} />GTM</span>
        <span><b style={{ background: "var(--powder)" }} />Ops</span>
      </div>
    </>
  );
}

function TeamSlide({ front }: { front: boolean }) {
  const rows = [
    { color: "var(--navy)", w: "72%" },
    { color: "var(--accent-d)", w: "56%" },
    { color: "var(--powder)", w: "64%" },
  ];
  return (
    <>
      <div className="slide-label">Slide 07 · Team</div>
      <div className="slide-title">Built to win this market</div>
      <div className="slide-people">
        {rows.map((r, i) => (
          <motion.div
            key={i}
            className="slide-person"
            animate={{ opacity: front ? 1 : 0.45, x: front ? 0 : -6 }}
            transition={{ delay: front ? 0.25 + i * 0.09 : 0, duration: 0.4, ease: EASE }}
          >
            <span className="dot" style={{ background: r.color }} />
            <span className="ln" style={{ width: r.w }} />
          </motion.div>
        ))}
      </div>
    </>
  );
}

function HeroDeck() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % 3), 3600);
    return () => clearInterval(id);
  }, [reduce]);

  const slides = [TractionSlide, AskSlide, TeamSlide];

  return (
    <div className="hero-deck fade-up" style={{ "--d": ".5s" } as CSSProperties} aria-hidden="true">
      <motion.div
        style={{ position: "absolute", inset: 0 }}
        animate={reduce ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {slides.map((Slide, i) => {
          const pos = (i - active + 3) % 3;
          const front = pos === 0;
          return (
            <motion.div
              key={i}
              className="slide-card"
              style={{ zIndex: 3 - pos }}
              animate={DECK_POS[pos]}
              transition={{ type: "spring", stiffness: 110, damping: 18 }}
            >
              <Slide front={front} />
              {front && i === 1 && (
                <motion.div
                  className="deck-chip"
                  initial={reduce ? false : { opacity: 0, scale: 0.7, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 260, damping: 18 }}
                >
                  <motion.span
                    className="pulse"
                    animate={reduce ? undefined : { opacity: [1, 0.35, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  Investor-ready
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { loading, error, start } = useCheckout();

  return (
    <SahShell>
      {/* ============ HERO ============ */}
      <section className="hero">
        {/* Growth curve draws itself across the band */}
        <svg className="hero-line" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0,228 C180,222 300,190 440,168 C580,146 660,118 800,86 C920,58 1060,30 1200,14"
            fill="none" stroke="var(--accent-d)" strokeWidth="2.5" opacity="0.5" pathLength="1"
          />
        </svg>

        <div className="container hero-inner">
          <div>
            <span className="eyebrow fade-up" style={{ "--d": ".05s" } as CSSProperties}>Series A fundraising</span>
            <h1><WordRise text="Raise your Series A with a deck investors can’t ignore." /></h1>
            <p className="lead fade-up" style={{ "--d": ".5s" } as CSSProperties}>
              Share a few details about your company. Get back a pitch deck structured around exactly what
              investors fund — guided by 25+ years of CFO experience.
            </p>

            <div className="hero-cta fade-up" style={{ "--d": ".62s" } as CSSProperties}>
              <button type="button" className="btn btn-primary" onClick={start} disabled={loading}>
                {loading ? "One moment…" : <>Build my deck <span className="arr">→</span></>}
              </button>
              <a className="btn btn-accent" href="/pricing">View pricing</a>
            </div>
            {error && <div className="form-msg error" role="alert">{error}</div>}
            <p className="form-note fade-up" style={{ "--d": ".72s" } as CSSProperties}>
              A guided intake, then a polished deck in 5–7 business days.
            </p>

            <div className="hero-badges fade-up" style={{ "--d": ".82s" } as CSSProperties}>
              <span><span className="check">✓</span> Investor-tested structure</span>
              <span><span className="check">✓</span> Built on real CFO experience</span>
              <span><span className="check">✓</span> Ready in a fraction of the time</span>
            </div>
          </div>

          <HeroDeck />
        </div>
      </section>

      {/* ============ STATEMENT BAND ============ */}
      <section className="band-cream" style={{ paddingBottom: "36px" }}>
        <div className="container">
          <Reveal>
            <div className="statement">
              <h2>Simplify your <em>raise.</em> Amplify your <em>results.</em></h2>
              <p>
                Raising a Series A doesn&rsquo;t have to be a guessing game. We cut through the noise and help
                founders put their most fundable story forward — combining a guided intake with the judgment
                of someone who has sat across the table from investors.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ EXPERT / ABOUT ============ */}
      <section id="expert" className="band-white" style={{ paddingTop: "44px" }}>
        <div className="container expert">
          <Reveal>
            <div className="expert-media">
              <div className="avatar">
                <img src="/brent-mcclure.webp" alt="Brent McClure, Founder of Gulfside Advisors" width={104} height={104} />
              </div>
              <h3>Brent McClure</h3>
              <div className="role">Founder, Gulfside Advisors · 25+ years</div>
              <p>
                A seasoned operator, C-suite executive, and strategist with over 25 years of experience
                working in and with private equity-backed and growth-stage companies — across SaaS,
                industrials, services, retail, logistics, and technology. Gulfside brings more than
                advice; it brings execution.
              </p>
              <div className="stats">
                <div className="stat"><div className="n"><CountUp to={750} prefix="$" suffix="M+" /></div><div className="l">Capital raised</div></div>
                <div className="stat"><div className="n"><CountUp to={25} suffix="+" /></div><div className="l">Acquisitions &amp; exits</div></div>
                <div className="stat"><div className="n"><CountUp to={25} suffix="+ yrs" /></div><div className="l">Experience</div></div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="expert-text">
              <span className="eyebrow">The real edge</span>
              <h2>You&rsquo;re not buying software. You&rsquo;re buying <em>experience.</em></h2>
              <p>
                The hard part of raising a Series A isn&rsquo;t making slides — it&rsquo;s knowing what to say, what to
                prove, and what investors will push on. That judgment is what our customers are really paying for.
              </p>
              <p>
                Series A Hub encodes Brent&rsquo;s decades of operating and capital-raising experience into a
                guided process — so any founder can put their best, most fundable version forward.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section id="process" className="band-powder">
        <div className="container">
          <Reveal>
            <div className="section-head center">
              <span className="eyebrow">The process</span>
              <h2>Three steps from idea to investor-ready</h2>
              <p>No blank page. No guessing what VCs want. Just a clear path to a deck that holds up in the room.</p>
            </div>
          </Reveal>
          <div className="steps">
            {[
              { num: "01", title: "Tell us about your company", body: "Share the essentials through a guided intake — your traction, market, model, team, and the round you’re targeting." },
              { num: "02", title: "We apply the CFO’s playbook", body: "Your inputs run through a process modeled on a veteran CFO’s experience — the same lens investors use to judge a Series A." },
              { num: "03", title: "Get your investor-ready deck", body: "Receive a polished pitch deck structured around what funders expect to see — story, numbers, and narrative aligned." },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 0.1}>
                <div className="step">
                  <div className="num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="get-started" className="band-navy contact">
        <div className="container narrow">
          <Reveal>
            <span className="eyebrow" style={{ color: "var(--accent)" }}>Ready when you are</span>
            <h2>Put your most fundable story forward</h2>
            <p className="lead">Start the guided intake today and have an investor-ready deck in your inbox within 5–7 business days.</p>
            <button type="button" className="btn btn-accent" onClick={start} disabled={loading}>
              {loading ? "One moment…" : <>Build my deck <span className="arr">→</span></>}
            </button>
            {error && <div className="form-msg error" role="alert">{error}</div>}
          </Reveal>
        </div>
      </section>
    </SahShell>
  );
}
