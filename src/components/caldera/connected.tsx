"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    step: "01",
    tag: "Payment & Intake",
    label: "Pay and submit your intake",
    hook: "30 minutes. No calls.",
    body: "A structured form captures everything an investor needs to evaluate your company. No back-and-forth — just a clear, comprehensive intake.",
    details: [
      "Company snapshot, problem & solution, market size",
      "Traction, KPIs, team bios, and current financials",
      "Raise amount, valuation expectations, use of funds",
    ],
    time: "~30 min to complete",
  },
  {
    step: "02",
    tag: "AI Generation",
    label: "AI drafts your deck and report",
    hook: "Hours, not weeks.",
    body: "Claude synthesizes your intake against proven Series A frameworks — Sequoia narrative structure, NfX market sizing, a16z financial storytelling.",
    details: [
      "Full slide-by-slide deck outline with speaker notes",
      "Written investment report covering your full thesis",
      "Built on patterns from 100+ successful Series A decks",
    ],
    time: "Generated within hours",
  },
  {
    step: "03",
    tag: "CFO Review",
    label: "Your CFO reviews every slide",
    hook: "Nothing ships until it's right.",
    body: "A seasoned CFO reviews the draft for accuracy, story arc, and investor-readiness. Numbers get stress-tested. Framing gets sharpened.",
    details: [
      "Every number and projection independently stress-tested",
      "Story arc and framing sharpened for your sector",
      "Delivered as an editable .pptx and full written report",
    ],
    time: "Delivered in 5–7 business days",
  },
];

/* ── Desktop sticky scroll ─────────────────────────────────────── */
function DesktopConnected() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = section.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      setActiveStep(Math.min(steps.length - 1, Math.floor(progress * steps.length)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{ minHeight: `${steps.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen grid grid-cols-2 overflow-hidden">
        {/* Left — image */}
        <div className="relative h-full">
          <img
            src="/image.png"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: "6px",
                  height: "6px",
                  background: i === activeStep ? "var(--color-slate-cyan)" : "rgba(255,255,255,0.3)",
                  transform: i === activeStep ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — cards */}
        <div className="relative h-full overflow-hidden" style={{ background: "var(--color-cream)" }}>
          {steps.map((s, i) => {
            const isActive = i === activeStep;
            const isPast = i < activeStep;
            let translateY = "72px";
            if (isActive) translateY = "0px";
            if (isPast) translateY = "-72px";

            return (
              <div
                key={s.step}
                className="absolute inset-0 flex flex-col"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: `translateY(${translateY})`,
                  transition: isPast
                    ? "transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease"
                    : "transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease",
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                <div
                  className="flex items-center justify-between px-10 py-5 lg:px-14"
                  style={{ borderBottom: "1px solid var(--color-sage)" }}
                >
                  <span
                    className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[var(--color-steel)]"
                    style={{ fontFamily: "var(--font-af)" }}
                  >
                    How it works
                  </span>
                  <span
                    className="text-[11px] font-[600] uppercase tracking-[0.14em]"
                    style={{ fontFamily: "var(--font-af)", color: "var(--color-hudson-blue)" }}
                  >
                    {s.tag}
                  </span>
                </div>

                <div className="relative flex flex-1 flex-col justify-between overflow-hidden px-10 pb-0 pt-8 lg:px-14">
                  <span
                    className="pointer-events-none absolute -right-6 top-4 select-none leading-none text-[var(--color-sage)]"
                    style={{
                      fontFamily: "var(--font-ppmondwest)",
                      fontFeatureSettings: '"liga" 0',
                      fontSize: "clamp(140px, 22vw, 220px)",
                      letterSpacing: "-0.04em",
                      opacity: 0.55,
                    }}
                  >
                    {s.step}
                  </span>

                  <div className="relative z-10 flex flex-col gap-5">
                    <p
                      className="text-[18px] leading-[1.2] tracking-[-0.18px] text-[var(--color-iron)]"
                      style={{
                        fontFamily: "var(--font-ppmondwest)",
                        fontFeatureSettings: '"liga" 0',
                        fontStyle: "italic",
                      }}
                    >
                      {s.hook}
                    </p>
                    <h3
                      className="text-[38px] font-[400] leading-[1.05] tracking-[-0.76px] text-[var(--color-ink)] lg:text-[44px]"
                      style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0' }}
                    >
                      {s.label}
                    </h3>
                    <p
                      className="max-w-[380px] text-[15px] font-[400] leading-[1.65] tracking-[-0.15px] text-[var(--color-steel)]"
                      style={{ fontFamily: "var(--font-af)" }}
                    >
                      {s.body}
                    </p>
                  </div>

                  <div className="relative z-10 mt-auto pb-8">
                    <p
                      className="mb-4 text-[11px] font-[600] uppercase tracking-[0.14em] text-[var(--color-fog)]"
                      style={{ fontFamily: "var(--font-af)" }}
                    >
                      What's included
                    </p>
                    <div className="flex flex-col">
                      {s.details.map((d, di) => (
                        <div
                          key={d}
                          className="gic-row-hover flex items-start gap-4 py-3 rounded-[4px]"
                          style={{
                            borderTop: di === 0 ? "1px solid var(--color-sage)" : "none",
                            borderBottom: "1px solid var(--color-sage)",
                          }}
                        >
                          <span
                            className="mt-[2px] shrink-0 text-[11px] font-[600] tracking-[0.06em]"
                            style={{ fontFamily: "var(--font-af)", color: "var(--color-hudson-blue)", minWidth: "24px" }}
                          >
                            {String(di + 1).padStart(2, "0")}
                          </span>
                          <span
                            className="text-[14px] font-[400] leading-[1.5] text-[var(--color-iron)]"
                            style={{ fontFamily: "var(--font-af)" }}
                          >
                            {d}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-2 rounded-[50px] px-3 py-1.5 text-[12px] font-[500]"
                        style={{
                          fontFamily: "var(--font-af)",
                          background: "rgba(0,129,192,0.07)",
                          border: "1px solid rgba(0,129,192,0.2)",
                          color: "var(--color-hudson-blue)",
                        }}
                      >
                        <span className="h-[5px] w-[5px] rounded-full" style={{ background: "var(--color-hudson-blue)" }} />
                        {s.time}
                      </span>
                      <span
                        className="text-[12px] font-[400] tabular-nums text-[var(--color-fog)]"
                        style={{ fontFamily: "var(--font-af)" }}
                      >
                        {String(i + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Mobile stacked layout ─────────────────────────────────────── */
function MobileConnected() {
  return (
    <section id="how-it-works" className="px-4 py-16">
      {/* Section header */}
      <div
        className="mb-8 flex items-center justify-between pb-4"
        style={{ borderBottom: "1px solid var(--color-sage)" }}
      >
        <span
          className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[var(--color-steel)]"
          style={{ fontFamily: "var(--font-af)" }}
        >
          How it works
        </span>
        <span
          className="text-[11px] font-[400] tabular-nums text-[var(--color-fog)]"
          style={{ fontFamily: "var(--font-af)" }}
        >
          3 steps
        </span>
      </div>

      <div className="flex flex-col gap-12">
        {steps.map((s, i) => (
          <div key={s.step} className="flex flex-col gap-5">
            {/* Step tag + number */}
            <div className="flex items-center justify-between">
              <span
                className="rounded-[4px] px-2.5 py-1 text-[11px] font-[600] uppercase tracking-[0.1em]"
                style={{
                  fontFamily: "var(--font-af)",
                  color: "var(--color-hudson-blue)",
                  background: "rgba(0,129,192,0.07)",
                  border: "1px solid rgba(0,129,192,0.18)",
                }}
              >
                {s.tag}
              </span>
              <span
                className="text-[48px] font-[400] leading-none tracking-[-0.96px] text-[var(--color-sage)]"
                style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0' }}
              >
                {s.step}
              </span>
            </div>

            {/* Hook + title */}
            <div className="flex flex-col gap-2">
              <p
                className="text-[15px] leading-[1.2] text-[var(--color-iron)]"
                style={{
                  fontFamily: "var(--font-ppmondwest)",
                  fontFeatureSettings: '"liga" 0',
                  fontStyle: "italic",
                }}
              >
                {s.hook}
              </p>
              <h3
                className="text-[28px] font-[400] leading-[1.08] tracking-[-0.56px] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0' }}
              >
                {s.label}
              </h3>
            </div>

            {/* Body */}
            <p
              className="text-[14px] font-[400] leading-[1.65] text-[var(--color-steel)]"
              style={{ fontFamily: "var(--font-af)" }}
            >
              {s.body}
            </p>

            {/* Detail rows */}
            <div className="flex flex-col">
              {s.details.map((d, di) => (
                <div
                  key={d}
                  className="gic-row-hover flex items-start gap-3 rounded-[4px] py-3"
                  style={{
                    borderTop: di === 0 ? "1px solid var(--color-sage)" : "none",
                    borderBottom: "1px solid var(--color-sage)",
                  }}
                >
                  <span
                    className="mt-[2px] shrink-0 text-[11px] font-[600]"
                    style={{ fontFamily: "var(--font-af)", color: "var(--color-hudson-blue)", minWidth: "20px" }}
                  >
                    {String(di + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[13px] font-[400] leading-[1.5] text-[var(--color-iron)]"
                    style={{ fontFamily: "var(--font-af)" }}
                  >
                    {d}
                  </span>
                </div>
              ))}
            </div>

            {/* Time badge */}
            <span
              className="inline-flex w-fit items-center gap-2 rounded-[50px] px-3 py-1.5 text-[12px] font-[500]"
              style={{
                fontFamily: "var(--font-af)",
                background: "rgba(0,129,192,0.07)",
                border: "1px solid rgba(0,129,192,0.2)",
                color: "var(--color-hudson-blue)",
              }}
            >
              <span className="h-[5px] w-[5px] rounded-full" style={{ background: "var(--color-hudson-blue)" }} />
              {s.time}
            </span>

            {/* Divider between steps */}
            {i < steps.length - 1 && (
              <div style={{ borderBottom: "1px solid var(--color-sage)", marginTop: "4px" }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Export: renders correct version per breakpoint ────────────── */
export function CalderaConnected() {
  return (
    <>
      <div className="hidden sm:block">
        <DesktopConnected />
      </div>
      <div className="sm:hidden" style={{ background: "var(--color-cream)" }}>
        <MobileConnected />
      </div>
    </>
  );
}
