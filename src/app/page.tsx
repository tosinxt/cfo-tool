"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { motion, useInView, useReducedMotion, useScroll, useMotionValueEvent, animate as motionAnimate } from "motion/react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--sah-sans" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--sah-serif" });

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Landing design is a port of the live marketing site (seriesahub.com) —
// navy/cream/khaki theme originally taken from gulfsideadvisors.com. The
// waitlist email forms from the live site are replaced with the product's
// real checkout CTA. Motion layer: orchestrated hero entrance, an animated
// deck-assembly stack, scroll reveals, and micro-interactions — all
// transform/opacity only, all disabled under prefers-reduced-motion.
const css = `
.sah {
  --navy: #003865;
  --navy-2: #002a4d;
  --cream: #fffefa;
  --sah-ink: #222222;
  --accent: #dfd1a7;
  --accent-d: #c9b787;
  --powder: #bbdde6;
  --gray: #6f7a85;
  --line: #e6e1d4;
  --maxw: 1140px;
  --radius: 16px;      /* squircle-ish controls */
  --radius-lg: 24px;   /* cards */
  --shadow: 0 24px 60px rgba(0,56,101,.14);
  --shadow-sm: 0 10px 30px rgba(0,56,101,.10);
  --serif: var(--sah-serif), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: var(--sah-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  font-family: var(--sans); color: var(--sah-ink);
  background: var(--cream); line-height: 1.65; font-size: 17px;
  -webkit-font-smoothing: antialiased;
}
.sah h1, .sah h2, .sah h3 { font-family: var(--serif); font-weight: 600; line-height: 1.12; margin: 0 0 .4em; color: var(--navy); letter-spacing: -0.02em; }
.sah h1 { font-size: clamp(2.4rem, 5vw, 3.6rem); }
.sah h2 { font-size: clamp(1.9rem, 3.8vw, 2.9rem); }
.sah h3 { font-size: 1.4rem; }
.sah p { margin: 0 0 1rem; }
.sah a { color: inherit; text-decoration: none; }

.sah .container { width: 100%; max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.sah .narrow { max-width: 760px; }

.sah .eyebrow {
  display: inline-block; font-family: var(--sans); font-weight: 600;
  font-size: .78rem; letter-spacing: .22em; text-transform: uppercase;
  color: var(--gray); margin-bottom: 20px;
}

.sah .btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  font-family: var(--sans); font-weight: 600; font-size: .92rem;
  letter-spacing: .06em; text-transform: uppercase;
  padding: 15px 30px; border-radius: var(--radius); border: 1.5px solid transparent;
  cursor: pointer; transition: transform .15s ease, box-shadow .2s ease, background .2s ease, color .2s ease;
  white-space: nowrap; touch-action: manipulation;
}
.sah .btn:disabled { opacity: .6; cursor: wait; transform: none; }
.sah .btn:active:not(:disabled) { transform: translateY(0) scale(.98); }
.sah .btn .arr { display: inline-block; transition: transform .2s ease; }
.sah .btn:hover:not(:disabled) .arr { transform: translateX(4px); }
.sah .btn-primary { background: var(--navy); color: #fff; }
.sah .btn-primary:hover:not(:disabled) { background: var(--navy-2); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.sah .btn-accent { background: var(--accent); color: var(--navy); }
.sah .btn-accent:hover:not(:disabled) { background: var(--accent-d); transform: translateY(-2px); }

.sah header.site {
  position: sticky; top: 0; z-index: 50; padding: 10px 0;
  background: rgba(255,254,250,.95);
  backdrop-filter: saturate(140%) blur(8px);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid var(--line);
  transition: background .35s ease, border-color .35s ease;
}
/* Scrolled: the flat bar dissolves and the nav floats as a glass pill */
.sah header.site.pill {
  background: transparent; border-bottom-color: transparent;
  backdrop-filter: none; -webkit-backdrop-filter: none;
}
.sah .nav {
  display: flex; align-items: center; justify-content: space-between;
  height: 58px; margin: 0 auto; max-width: 100%;
  padding: 0; border-radius: 999px; border: 1px solid transparent;
  transition: max-width .45s cubic-bezier(.22,1,.36,1), background .35s ease,
    border-color .35s ease, box-shadow .35s ease, padding .35s ease;
}
.sah header.site.pill .nav {
  max-width: 840px; padding: 0 10px 0 24px;
  background: rgba(255,254,250,.72);
  backdrop-filter: blur(18px) saturate(1.5);
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  border-color: rgba(0,56,101,.10);
  box-shadow: 0 12px 32px rgba(0,56,101,.14), inset 0 1px 0 rgba(255,255,255,.7);
}
.sah .brand { display: flex; align-items: center; gap: 11px; font-family: var(--serif); font-weight: 700; font-size: 1.35rem; color: var(--navy); letter-spacing: -0.01em; }
.sah .brand .mark { width: 12px; height: 12px; background: var(--accent); display: inline-block; transform: rotate(45deg); transition: transform .4s cubic-bezier(.22,1,.36,1); }
.sah .brand:hover .mark { transform: rotate(225deg); }
.sah .nav-links { display: flex; align-items: center; gap: 34px; }
.sah .nav-links a { color: var(--navy); font-size: .82rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
.sah .nav-links a.plain { position: relative; }
.sah .nav-links a.plain::after {
  content: ""; position: absolute; left: 0; bottom: -5px; height: 2px; width: 100%;
  background: var(--accent-d); transform: scaleX(0); transform-origin: left;
  transition: transform .25s cubic-bezier(.22,1,.36,1);
}
.sah .nav-links a.plain:hover::after { transform: scaleX(1); }
.sah .nav-links .nav-cta { padding: 11px 24px; font-size: .78rem; color: #fff; border-radius: 999px; }

.sah .hero { background: var(--powder); position: relative; overflow: hidden; }
.sah .hero-inner {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 56px; align-items: center;
  padding-top: 84px; padding-bottom: 88px;
}
.sah .hero h1 { margin-bottom: 24px; max-width: 640px; }
.sah .hero p.lead { font-size: 1.24rem; color: #1d3a52; max-width: 560px; margin-bottom: 36px; line-height: 1.6; }
.sah .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.sah .form-note { font-size: .85rem; color: #496073; margin-top: 16px; }
.sah .form-msg { margin-top: 14px; font-weight: 600; font-size: .95rem; min-height: 1.2em; }
.sah .form-msg.error { color: #b3261e; }

.sah .hero-badges { display: flex; gap: 24px 30px; flex-wrap: wrap; margin-top: 40px; color: #1d3a52; font-size: .92rem; font-weight: 500; }
.sah .hero-badges span { display: inline-flex; align-items: center; gap: 9px; }
.sah .check { color: var(--navy); font-weight: 700; }

/* Hero entrance choreography (CSS-only, GPU transforms) */
@keyframes sahRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
.sah .hero h1 .w {
  display: inline-block; opacity: 0; transform: translateY(18px);
  animation: sahRise .6s cubic-bezier(.22,1,.36,1) forwards;
  animation-delay: calc(.12s + var(--i) * .04s);
}
.sah .fade-up {
  opacity: 0; transform: translateY(16px);
  animation: sahRise .6s cubic-bezier(.22,1,.36,1) forwards;
  animation-delay: var(--d, 0s);
}

/* Growth curve drawing itself across the hero band */
.sah .hero-line { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 42%; pointer-events: none; }
@keyframes sahDraw { to { stroke-dashoffset: 0; } }
.sah .hero-line path {
  stroke-dasharray: 1; stroke-dashoffset: 1;
  animation: sahDraw 2.4s .5s cubic-bezier(.22,1,.36,1) forwards;
}

/* Animated deck stack */
.sah .hero-deck { position: relative; width: 400px; height: 300px; }
.sah .slide-card {
  position: absolute; top: 0; left: 0; width: 320px; height: 218px;
  background: #fff; border: 1px solid rgba(0,56,101,.12); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm); padding: 20px 24px; will-change: transform;
}
.sah .slide-card .slide-label {
  font-size: .62rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
  color: var(--gray); margin-bottom: 4px;
}
.sah .slide-card .slide-title { font-family: var(--serif); font-weight: 600; font-size: 1.05rem; color: var(--navy); margin-bottom: 14px; }
.sah .slide-bars { display: flex; align-items: flex-end; gap: 9px; height: 104px; }
.sah .slide-bars span {
  flex: 1; border-radius: 2px 2px 0 0; transform-origin: bottom;
  background: linear-gradient(to top, var(--navy), #14507f);
}
.sah .slide-bars span:nth-child(even) { background: var(--accent-d); }
.sah .slide-ask-n { font-family: var(--serif); font-weight: 700; font-size: 2.5rem; color: var(--navy); line-height: 1; margin: 10px 0 16px; }
.sah .slide-track { height: 12px; border-radius: 99px; overflow: hidden; display: flex; transform-origin: left; }
.sah .slide-track i { display: block; height: 100%; }
.sah .slide-legend { display: flex; gap: 14px; margin-top: 10px; font-size: .62rem; letter-spacing: .08em; text-transform: uppercase; color: var(--gray); }
.sah .slide-legend b { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; }
.sah .slide-people { display: flex; flex-direction: column; gap: 13px; margin-top: 6px; }
.sah .slide-person { display: flex; align-items: center; gap: 11px; }
.sah .slide-person .dot { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; }
.sah .slide-person .ln { height: 8px; border-radius: 99px; background: rgba(0,56,101,.10); }
.sah .deck-chip {
  position: absolute; top: -13px; right: 14px; display: inline-flex; align-items: center; gap: 6px;
  background: var(--accent); color: var(--navy); font-size: .66rem; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; padding: 5px 11px; border-radius: 99px;
  box-shadow: 0 4px 12px rgba(0,56,101,.18);
}
.sah .deck-chip .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--navy); }

.sah section { padding: 84px 0; }
.sah .band-cream { background: var(--cream); }
.sah .band-white { background: #fff; }
.sah .band-powder { background: var(--powder); }
.sah .band-navy { background: var(--navy); color: #fff; }
.sah .band-navy h1, .sah .band-navy h2, .sah .band-navy h3 { color: #fff; }

.sah .section-head { max-width: 720px; margin-bottom: 60px; }
.sah .section-head.center { margin-left: auto; margin-right: auto; text-align: center; }
.sah .section-head p { color: var(--gray); font-size: 1.12rem; }

.sah .statement { text-align: center; max-width: 860px; margin: 0 auto; }
.sah .statement h2 { margin-bottom: 28px; }
.sah .statement h2 em { font-style: normal; color: var(--accent-d); }
.sah .statement p { font-size: 1.18rem; color: var(--gray); }

.sah .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 38px; }
.sah .step .num {
  font-family: var(--serif); font-weight: 700; font-size: 2.4rem; color: var(--accent-d);
  line-height: 1; margin-bottom: 14px; transition: color .25s ease;
}
.sah .step:hover .num { color: var(--navy); }
.sah .step h3 { margin-bottom: 10px; }
.sah .step p { color: var(--gray); margin: 0; font-size: 1rem; }

.sah .expert { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.sah .expert-media {
  background: var(--navy); color: #fff; border-radius: var(--radius-lg);
  padding: 48px 44px; box-shadow: var(--shadow);
  transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
}
.sah .expert-media:hover { transform: translateY(-5px); box-shadow: 0 32px 70px rgba(0,56,101,.2); }
.sah .expert-media .avatar {
  width: 104px; height: 104px; border-radius: 50%; background: var(--accent);
  margin-bottom: 24px; overflow: hidden; border: 3px solid rgba(255,255,255,.18);
}
.sah .expert-media .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sah .expert-media h3 { color: #fff; }
.sah .expert-media .role { color: var(--accent); font-weight: 600; font-size: .82rem; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 18px; }
.sah .expert-media p { color: rgba(255,255,255,.82); font-size: 1rem; }
.sah .stats { display: flex; gap: 28px 44px; margin-top: 30px; flex-wrap: wrap; justify-content: center; }
.sah .stat { text-align: center; }
.sah .stat .n { font-family: var(--serif); font-weight: 700; font-size: 2rem; color: var(--accent); font-variant-numeric: tabular-nums; }
.sah .stat .l { font-size: .8rem; color: rgba(255,255,255,.7); letter-spacing: .06em; text-transform: uppercase; }
.sah .expert-text h2 em { font-style: normal; color: var(--accent-d); }
.sah .expert-text p { color: var(--gray); font-size: 1.1rem; }

.sah .contact { text-align: center; }
.sah .contact p.lead { color: rgba(255,255,255,.82); font-size: 1.16rem; max-width: 580px; margin: 0 auto 34px; }
.sah .contact .form-msg.error { color: #ffb3ad; }

.sah footer.site { background: var(--navy-2); color: rgba(255,255,255,.6); padding: 44px 0; }
.sah .foot { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; }
.sah .foot .brand { color: #fff; font-size: 1.25rem; }
.sah .foot a { color: rgba(255,255,255,.6); font-size: .88rem; }
.sah .foot a:hover { color: #fff; }
.sah .foot-links { display: flex; gap: 22px; }

@media (max-width: 1000px) {
  .sah .hero-inner { grid-template-columns: 1fr; }
  .sah .hero-deck { display: none; }
}
@media (max-width: 880px) {
  .sah .nav-links .plain { display: none; }
  .sah .steps { grid-template-columns: 1fr; gap: 30px; }
  .sah .expert { grid-template-columns: 1fr; gap: 36px; }
  .sah section { padding: 72px 0; }
  .sah { font-size: 16px; }
  .sah .hero-inner { padding-top: 56px; padding-bottom: 64px; }
  .sah .hero h1 { font-size: 2.5rem; margin-bottom: 18px; }
  .sah .hero p.lead { font-size: 1.12rem; margin-bottom: 28px; }
  .sah .hero-badges { margin-top: 36px; gap: 16px 26px; }
  .sah .section-head { margin-bottom: 44px; }
}
@media (max-width: 560px) {
  .sah .container { padding: 0 30px; }
  .sah .nav { height: 52px; }
  .sah header.site.pill .nav { padding: 0 6px 0 16px; }
  .sah .brand { font-size: 1.15rem; gap: 8px; }
  .sah .nav-links { gap: 0; }
  .sah .nav-links .nav-cta { padding: 9px 14px; font-size: .7rem; letter-spacing: .03em; }
  .sah .hero-inner { padding-top: 36px; padding-bottom: 48px; }
  .sah .hero h1 { font-size: 2rem; line-height: 1.16; }
  .sah .hero p.lead { font-size: 1.05rem; }
  .sah .eyebrow { margin-bottom: 14px; }
  .sah section { padding: 56px 0; }
  .sah .hero-cta .btn { flex: 1 1 100%; width: 100%; }
  .sah .expert-media { padding: 32px 26px; }
  .sah .stats { gap: 22px 28px; }
  .sah .statement p, .sah .section-head p { font-size: 1.02rem; }
  .sah .foot { flex-direction: column; align-items: flex-start; gap: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .sah .hero h1 .w, .sah .fade-up { animation: none; opacity: 1; transform: none; }
  .sah .hero-line path { animation: none; stroke-dashoffset: 0; }
  .sah .brand .mark, .sah .nav-links a.plain::after, .sah .btn, .sah .btn .arr,
  .sah .expert-media, .sah .step .num { transition: none; }
}
`;

/* ── Motion helpers ─────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

function WordRise({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="w" style={{ "--i": i } as CSSProperties}>
          {w}{" "}
        </span>
      ))}
    </>
  );
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setVal(to); return; }
    const controls = motionAnimate(0, to, {
      duration: 1.4, ease: EASE,
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return <span ref={ref}>{prefix}{val}{suffix}</span>;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  async function handleGetStarted() {
    if (DEMO_MODE) {
      window.location.href = "/intake/demo-engagement-001?token=demo-token-insecure";
      return;
    }
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

  return (
    <div className={`sah ${inter.variable} ${grotesk.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ============ HEADER ============ */}
      <header className={`site${scrolled ? " pill" : ""}`}>
        <div className="container">
          <div className="nav">
            <a className="brand" href="#top"><span className="mark" />Series A Hub</a>
            <nav className="nav-links">
              <a className="plain" href="#expert">The expertise</a>
              <a className="plain" href="#process">Process</a>
              <a className="plain" href="/pricing">Pricing</a>
              <button type="button" className="btn btn-primary nav-cta" onClick={handleGetStarted} disabled={loading}>
                {loading ? "One moment…" : "Get started"}
              </button>
            </nav>
          </div>
        </div>
      </header>

      <a id="top" />

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
              <button type="button" className="btn btn-primary" onClick={handleGetStarted} disabled={loading}>
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
            <button type="button" className="btn btn-accent" onClick={handleGetStarted} disabled={loading}>
              {loading ? "One moment…" : <>Build my deck <span className="arr">→</span></>}
            </button>
            {error && <div className="form-msg error" role="alert">{error}</div>}
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="site">
        <div className="container foot">
          <a className="brand" href="#top"><span className="mark" />Series A Hub</a>
          <div className="foot-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </div>
          <div>© {new Date().getFullYear()} Series A Hub. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
