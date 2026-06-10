"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const deliverables = [
  {
    index: "01",
    label: "Pitch deck",
    title: "Investor-ready pitch deck",
    body: "A full slide deck built on proven Series A structures — problem, solution, market, traction, team, financials, ask. Every slide written and reviewed by a CFO.",
    details: [
      { n: "01", text: "Sequoia-style narrative arc" },
      { n: "02", text: "Slide-by-slide speaker notes" },
      { n: "03", text: "Editable .pptx on delivery" },
      { n: "04", text: "Sector-specific framing" },
    ],
    footnote: "~12–16 slides",
    image: "/deck.png",
  },
  {
    index: "02",
    label: "Written report",
    title: "Written investment report",
    body: "A long-form narrative document covering your complete investment thesis in depth — for investors who read before they meet.",
    details: [
      { n: "01", text: "Full market sizing narrative" },
      { n: "02", text: "Traction and unit economics" },
      { n: "03", text: "Team and founder story" },
      { n: "04", text: "Use of funds breakdown" },
    ],
    footnote: "10–20 pages",
    image: "/report.png",
  },
  {
    index: "03",
    label: "CFO review",
    title: "CFO-reviewed financials",
    body: "Every number, assumption, and projection reviewed by a CFO with deep Series A experience. Your story holds up under diligence.",
    details: [
      { n: "01", text: "Revenue model stress-tested" },
      { n: "02", text: "Burn rate and runway verified" },
      { n: "03", text: "Valuation framing reviewed" },
      { n: "04", text: "Projection assumptions checked" },
    ],
    footnote: "Included in every engagement",
    image: "/financials.png",
  },
];

const n = deliverables.length;

/* ── Desktop horizontal scroll ─────────────────────────────────── */
function DesktopCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = section.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, scrolled / scrollable)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeCard = Math.min(n - 1, Math.floor(progress * n));
  const trackVw = progress * (n - 1) * 100;

  return (
    <section
      id="what-you-get"
      ref={sectionRef}
      style={{ minHeight: `${n * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: `${n * 100}vw`,
            transform: `translateX(-${trackVw}vw)`,
            willChange: "transform",
          }}
        >
          {deliverables.map((d, i) => {
            const isPast = i < activeCard;
            const relPos = i - progress * (n - 1);

            return (
              <div
                key={d.index}
                className="relative flex h-full"
                style={{
                  width: "100vw",
                  flexShrink: 0,
                  transform: isPast ? "scale(0.96)" : "scale(1)",
                  transition: "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
                  transformOrigin: "center center",
                }}
              >
                {/* Left content */}
                <div
                  className="relative flex h-full flex-col justify-between px-10 py-10 lg:px-16 lg:py-14"
                  style={{ width: "52%", flexShrink: 0, background: "var(--color-cream)" }}
                >
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
                      {d.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {deliverables.map((_, di) => (
                        <div
                          key={di}
                          className="rounded-full transition-all duration-500"
                          style={{
                            width: di === i ? "20px" : "6px",
                            height: "6px",
                            background: di === i ? "var(--color-hudson-blue)" : "var(--color-sage)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <span
                      className="select-none leading-none"
                      style={{
                        fontFamily: "var(--font-ppmondwest)",
                        fontFeatureSettings: '"liga" 0',
                        fontSize: "clamp(80px, 12vw, 140px)",
                        color: "var(--color-sage)",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                      }}
                    >
                      {d.index}
                    </span>
                    <h3
                      className="text-[36px] font-[400] leading-[1.05] tracking-[-0.72px] text-[var(--color-ink)] lg:text-[48px]"
                      style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0' }}
                    >
                      {d.title}
                    </h3>
                    <p
                      className="max-w-[420px] text-[15px] font-[400] leading-[1.7] tracking-[-0.15px] text-[var(--color-steel)]"
                      style={{ fontFamily: "var(--font-af)" }}
                    >
                      {d.body}
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div
                      className="grid grid-cols-2 gap-x-6"
                      style={{ borderTop: "1px solid var(--color-sage)", paddingTop: "20px" }}
                    >
                      {d.details.map((item) => (
                        <div
                          key={item.n}
                          className="gic-row-hover flex items-start gap-3 rounded-[4px] py-3"
                          style={{ borderBottom: "1px solid var(--color-sage)" }}
                        >
                          <span
                            className="mt-[2px] shrink-0 text-[11px] font-[600] tabular-nums"
                            style={{ fontFamily: "var(--font-af)", color: "var(--color-hudson-blue)", minWidth: "20px" }}
                          >
                            {item.n}
                          </span>
                          <span
                            className="text-[13px] font-[400] leading-[1.45] text-[var(--color-iron)]"
                            style={{ fontFamily: "var(--font-af)" }}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-[400] uppercase tracking-[0.1em] text-[var(--color-fog)]"
                        style={{ fontFamily: "var(--font-af)" }}
                      >
                        {d.footnote}
                      </span>
                      {i < n - 1 ? (
                        <span className="text-[12px] font-[400] text-[var(--color-fog)]" style={{ fontFamily: "var(--font-af)" }}>
                          scroll ↓
                        </span>
                      ) : (
                        <a
                          href="#get-started"
                          className="text-[13px] font-[500] underline underline-offset-4 transition-colors hover:text-[var(--color-hudson-blue)]"
                          style={{ fontFamily: "var(--font-af)", color: "var(--color-steel)", textDecorationColor: "var(--color-sage)" }}
                        >
                          Get your pitch deck →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right image */}
                <div className="relative h-full overflow-hidden" style={{ width: "48%", flexShrink: 0 }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "var(--color-linen)",
                      backgroundImage:
                        "linear-gradient(var(--color-sage) 1px, transparent 1px), linear-gradient(90deg, var(--color-sage) 1px, transparent 1px)",
                      backgroundSize: "36px 36px",
                      opacity: 0.4,
                    }}
                  />
                  <Image
                    src={d.image}
                    alt={d.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 48vw"
                    className="object-cover"
                    style={{ transform: `translateY(${relPos * -40}px) scale(1.05)`, willChange: "transform" }}
                    quality={85}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to right, var(--color-cream) 0%, transparent 18%)" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at 60% 50%, transparent 40%, rgba(254,255,252,0.3) 100%)" }}
                  />
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
function MobileCards() {
  return (
    <section id="what-you-get" className="px-4 py-16" style={{ background: "var(--color-cream)" }}>
      {/* Section header */}
      <div
        className="mb-8 flex items-center justify-between pb-4"
        style={{ borderBottom: "1px solid var(--color-sage)" }}
      >
        <span
          className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[var(--color-steel)]"
          style={{ fontFamily: "var(--font-af)" }}
        >
          What you get
        </span>
        <span
          className="text-[11px] font-[400] tabular-nums text-[var(--color-fog)]"
          style={{ fontFamily: "var(--font-af)" }}
        >
          3 deliverables
        </span>
      </div>

      <div className="flex flex-col gap-14">
        {deliverables.map((d, i) => (
          <div key={d.index} className="flex flex-col gap-5">
            {/* Image */}
            <div
              className="relative h-[220px] w-full overflow-hidden rounded-[12px]"
              style={{
                background: "var(--color-linen)",
                backgroundImage:
                  "linear-gradient(var(--color-sage) 1px, transparent 1px), linear-gradient(90deg, var(--color-sage) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            >
              <Image
                src={d.image}
                alt={d.title}
                fill
                sizes="100vw"
                className="object-cover"
                quality={85}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
              />
            </div>

            {/* Label chip + index */}
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
                {d.label}
              </span>
              <span
                className="text-[40px] font-[400] leading-none tracking-[-0.8px] text-[var(--color-sage)]"
                style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0' }}
              >
                {d.index}
              </span>
            </div>

            {/* Title + body */}
            <div className="flex flex-col gap-3">
              <h3
                className="text-[26px] font-[400] leading-[1.08] tracking-[-0.52px] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0' }}
              >
                {d.title}
              </h3>
              <p
                className="text-[14px] font-[400] leading-[1.65] text-[var(--color-steel)]"
                style={{ fontFamily: "var(--font-af)" }}
              >
                {d.body}
              </p>
            </div>

            {/* Details */}
            <div className="flex flex-col" style={{ borderTop: "1px solid var(--color-sage)" }}>
              {d.details.map((item) => (
                <div
                  key={item.n}
                  className="gic-row-hover flex items-start gap-3 rounded-[4px] py-3"
                  style={{ borderBottom: "1px solid var(--color-sage)" }}
                >
                  <span
                    className="mt-[2px] shrink-0 text-[11px] font-[600] tabular-nums"
                    style={{ fontFamily: "var(--font-af)", color: "var(--color-hudson-blue)", minWidth: "20px" }}
                  >
                    {item.n}
                  </span>
                  <span
                    className="text-[13px] font-[400] leading-[1.45] text-[var(--color-iron)]"
                    style={{ fontFamily: "var(--font-af)" }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Footnote */}
            <span
              className="text-[11px] font-[400] uppercase tracking-[0.1em] text-[var(--color-fog)]"
              style={{ fontFamily: "var(--font-af)" }}
            >
              {d.footnote}
            </span>

            {/* CTA on last card */}
            {i === deliverables.length - 1 && (
              <a
                href="#get-started"
                className="mt-1 text-[14px] font-[500] underline underline-offset-4"
                style={{ fontFamily: "var(--font-af)", color: "var(--color-steel)", textDecorationColor: "var(--color-sage)" }}
              >
                Get your pitch deck →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Export ─────────────────────────────────────────────────────── */
export function CalderaCards() {
  return (
    <>
      <div className="hidden sm:block">
        <DesktopCards />
      </div>
      <div className="sm:hidden">
        <MobileCards />
      </div>
    </>
  );
}
