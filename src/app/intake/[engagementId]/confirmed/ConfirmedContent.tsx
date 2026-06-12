"use client";

import { useState, useEffect } from "react";
import Cloudscape from "@/components/forgeui/cloudscape";

const PARTICLES = [
  { angle: 10,  dist: 90,  color: "#0081c0", size: 7,  round: true  },
  { angle: 35,  dist: 110, color: "#93c5fd", size: 5,  round: false },
  { angle: 60,  dist: 95,  color: "#22c55e", size: 4,  round: true  },
  { angle: 85,  dist: 105, color: "#0081c0", size: 6,  round: false },
  { angle: 110, dist: 80,  color: "#bfdbfe", size: 5,  round: true  },
  { angle: 140, dist: 115, color: "#41a1cf", size: 4,  round: false },
  { angle: 170, dist: 88,  color: "#0081c0", size: 7,  round: true  },
  { angle: 200, dist: 98,  color: "#93c5fd", size: 5,  round: false },
  { angle: 230, dist: 108, color: "#22c55e", size: 4,  round: true  },
  { angle: 260, dist: 85,  color: "#0081c0", size: 6,  round: false },
  { angle: 290, dist: 102, color: "#bfdbfe", size: 5,  round: true  },
  { angle: 320, dist: 92,  color: "#41a1cf", size: 4,  round: false },
  { angle: 350, dist: 112, color: "#0081c0", size: 6,  round: true  },
  { angle: 50,  dist: 70,  color: "#22c55e", size: 3,  round: true  },
  { angle: 160, dist: 75,  color: "#93c5fd", size: 3,  round: false },
  { angle: 280, dist: 68,  color: "#41a1cf", size: 3,  round: true  },
] as const;

const NEXT_STEPS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    label: "Intake reviewed",
    desc: "Our team reviews your intake and begins drafting your narrative",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "CFO-level refinement",
    desc: "A strategist shapes the narrative and stress-tests your numbers",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    label: "Deck delivered",
    desc: "You receive a polished deck and written report, investor-ready",
  },
];

export default function ConfirmedContent({ engagementId, token }: { engagementId?: string; token?: string }) {
  const [mounted, setMounted]       = useState(false);
  const [drawCheck, setDrawCheck]   = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRows, setShowRows]     = useState([false, false, false]);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setDrawCheck(true), 420);
    const t2 = setTimeout(() => setShowConfetti(true), 520);
    const t3 = setTimeout(() => setShowConfetti(false), 1800);

    NEXT_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setShowRows(prev => { const n = [...prev] as [boolean,boolean,boolean]; n[i] = true; return n; });
      }, 960 + i * 180);
      return () => clearTimeout(t);
    });

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <main
      style={{
        position: "relative", minHeight: "100svh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "64px 24px",
        fontFamily: "var(--font-af)",
        overflow: "hidden",
      }}
    >
      {/* Cloudscape — faster, more visible */}
      <Cloudscape
        colorBottom="#a8c8e8"
        colorMid="#d4e8d4"
        colorTop="#e8e4f0"
        speed={1.2}
        height="100dvh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: 0, width: "100vw", height: "100dvh" }}
      />

      <style>{`
        @keyframes gic-particle {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          60%  { opacity: 0.8; }
          100% { transform: translate(calc(-50% + var(--pdx)), calc(-50% + var(--pdy))) scale(0.1); opacity: 0; }
        }
        @keyframes pulse-ring {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: "relative", zIndex: 1, width: "100%", maxWidth: "500px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 400ms ease, transform 400ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <span style={{
            fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0',
            fontSize: "16px", fontWeight: 400, letterSpacing: "-0.32px", color: "var(--color-ink)",
          }}>
            Pitch<span style={{ color: "var(--color-hudson-blue)" }}>Ready</span>
          </span>
        </div>

        {/* Icon + confetti */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: "40px", height: "72px" }}>
          {/* Pulse ring */}
          {drawCheck && (
            <>
              <div style={{ position: "absolute", top: "50%", left: "50%", width: "64px", height: "64px", borderRadius: "50%", border: "1.5px solid rgba(0,129,192,0.4)", animation: "pulse-ring 1.4s cubic-bezier(0.22,1,0.36,1) 0.1s both" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", width: "64px", height: "64px", borderRadius: "50%", border: "1.5px solid rgba(0,129,192,0.25)", animation: "pulse-ring 1.4s cubic-bezier(0.22,1,0.36,1) 0.3s both" }} />
            </>
          )}

          {/* Confetti */}
          {showConfetti && PARTICLES.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            const pdx = Math.cos(rad) * p.dist;
            const pdy = Math.sin(rad) * p.dist;
            return (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: `${p.size}px`, height: `${p.size}px`,
                borderRadius: p.round ? "50%" : "2px",
                background: p.color, pointerEvents: "none",
                ["--pdx" as string]: `${pdx}px`,
                ["--pdy" as string]: `${pdy}px`,
                animation: `gic-particle ${480 + i * 22}ms cubic-bezier(0.22,1,0.36,1) ${i * 16}ms both`,
              }} />
            );
          })}

          {/* Icon circle */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: mounted ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.3)",
            opacity: mounted ? 1 : 0,
            width: "64px", height: "64px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 4px 24px rgba(0,129,192,0.18), 0 1px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
            border: "1px solid rgba(0,129,192,0.2)",
            transition: "transform 500ms cubic-bezier(0.34,1.56,0.64,1) 200ms, opacity 300ms ease 200ms",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-hudson-blue)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M5 13l4 4L19 7"
                pathLength="1" strokeDasharray="1"
                strokeDashoffset={drawCheck ? 0 : 1}
                style={{ transition: drawCheck ? "stroke-dashoffset 600ms cubic-bezier(0.25,0.46,0.45,0.94)" : "none" }}
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div style={{
          textAlign: "center", marginBottom: "36px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 380ms ease 520ms, transform 380ms ease 520ms",
        }}>
          <h1 style={{
            fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0',
            fontSize: "clamp(34px, 8vw, 48px)", fontWeight: 400,
            lineHeight: 1.05, letterSpacing: "-1px",
            color: "var(--color-ink)", marginBottom: "14px",
          }}>
            You&apos;re all set.
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--color-steel)", maxWidth: "360px", margin: "0 auto" }}>
            We received your intake and will deliver your investor-ready pitch deck within{" "}
            <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>5–7 business days</span>.
          </p>
        </div>

        {/* What happens next — glassmorphic card */}
        <div style={{
          borderRadius: "16px",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)",
          padding: "28px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 380ms ease 680ms, transform 380ms ease 680ms",
        }}>
          <p style={{
            fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#9ca39c",
            fontFamily: "var(--font-af)", marginBottom: "20px",
          }}>
            What happens next
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {NEXT_STEPS.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "16px",
                padding: "16px 0",
                borderBottom: i < NEXT_STEPS.length - 1 ? "1px solid rgba(0,0,0,0.07)" : "none",
                opacity: showRows[i] ? 1 : 0,
                transform: showRows[i] ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 320ms ease, transform 320ms cubic-bezier(0.22,1,0.36,1)",
              }}>
                {/* Step number + icon */}
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: showRows[i] ? "rgba(0,129,192,0.08)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${showRows[i] ? "rgba(0,129,192,0.2)" : "rgba(0,0,0,0.08)"}`,
                    color: showRows[i] ? "var(--color-hudson-blue)" : "#c4c9c4",
                    transition: "background 400ms ease, border-color 400ms ease, color 400ms ease",
                  }}>
                    {item.icon}
                  </div>
                </div>

                <div style={{ flex: 1, paddingTop: "2px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-ink)", fontFamily: "var(--font-af)", marginBottom: "3px", letterSpacing: "-0.01em" }}>
                    {item.label}
                  </div>
                  <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#9ca39c", fontFamily: "var(--font-af)" }}>
                    {item.desc}
                  </p>
                </div>

                {/* Step index */}
                <span style={{
                  flexShrink: 0, fontSize: "11px", fontWeight: 600,
                  fontFamily: "var(--font-af)", color: showRows[i] ? "var(--color-hudson-blue)" : "#d4d9d4",
                  fontVariantNumeric: "tabular-nums", paddingTop: "3px",
                  transition: "color 300ms ease",
                }}>
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* View deck CTA */}
        {engagementId && token && (
          <div style={{
            textAlign: "center", marginTop: "28px",
            opacity: mounted ? 1 : 0,
            transition: "opacity 400ms ease 1600ms",
          }}>
            <a
              href={`/deck/${engagementId}?token=${encodeURIComponent(token)}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "8px",
                background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(0,129,192,0.25)",
                color: "var(--color-hudson-blue)", fontSize: "13px", fontWeight: 600,
                fontFamily: "var(--font-af)", textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "box-shadow 150ms, background 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.95)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.8)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
              </svg>
              View your deck
            </a>
          </div>
        )}

        {/* Footer */}
        <p style={{
          textAlign: "center", fontSize: "12px", color: "#9ca39c",
          fontFamily: "var(--font-af)", marginTop: "28px", lineHeight: 1.6,
          opacity: mounted ? 1 : 0,
          transition: "opacity 400ms ease 1400ms",
        }}>
          Questions?{" "}
          <a href="mailto:support@pitchready.co"
            style={{ color: "var(--color-hudson-blue)", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
          >
            Reply to the confirmation email
          </a>{" "}we sent you.
        </p>
      </div>
    </main>
  );
}
