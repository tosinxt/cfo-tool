"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Cloudscape from "@/components/forgeui/cloudscape";
import type { DeckSlide, SlideType } from "@/lib/ai/types";

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  title: "Title",
  problem: "Problem",
  solution: "Solution",
  market: "Market",
  traction: "Traction",
  team: "Team",
  financials: "Financials",
  ask: "The Ask",
  appendix: "Appendix",
};

const SLIDE_TYPE_ICONS: Record<SlideType, React.ReactNode> = {
  title: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>,
  problem: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 8v4M12 16h.01"/></svg>,
  solution: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  market: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9l6 3"/></svg>,
  traction: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline strokeLinecap="round" strokeLinejoin="round" points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline strokeLinecap="round" strokeLinejoin="round" points="16 7 22 7 22 13"/></svg>,
  team: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  financials: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4"/></svg>,
  ask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  appendix: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
};

interface Props {
  engagementId: string;
  token: string;
  companyName: string;
  slides: DeckSlide[];
  hasDeckFile: boolean;
  status: string;
}

const STATUS_COPY: Record<string, { label: string; color: string; bg: string; border: string }> = {
  drafting:          { label: "AI draft in progress",   color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  ready_for_review:  { label: "Under CFO review",       color: "#0081c0", bg: "rgba(0,129,192,0.07)",  border: "rgba(0,129,192,0.25)" },
  approved:          { label: "Approved — finalising",  color: "#7c3aed", bg: "rgba(124,58,237,0.07)", border: "rgba(124,58,237,0.25)" },
  delivered:         { label: "Deck delivered",         color: "#16a34a", bg: "rgba(34,197,94,0.07)",  border: "rgba(34,197,94,0.25)" },
};

export default function DeckViewer({ engagementId, token, companyName, slides, hasDeckFile, status }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [direction, setDirection] = useState(1);

  const badge = STATUS_COPY[status] ?? STATUS_COPY.drafting;
  const hasSlides = slides.length > 0;
  const activeSlide = slides[activeIdx];

  function goTo(i: number) {
    setDirection(i > activeIdx ? 1 : -1);
    setActiveIdx(i);
  }

  function prev() { if (activeIdx > 0) goTo(activeIdx - 1); }
  function next() { if (activeIdx < slides.length - 1) goTo(activeIdx + 1); }

  async function handleDownload() {
    setDownloading(true);
    try {
      window.location.href = `/api/deck/${engagementId}/download?token=${encodeURIComponent(token)}`;
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <main className="relative min-h-dvh px-4 pb-16 pt-8 sm:px-8 sm:pt-12"
      style={{ fontFamily: "var(--font-af)" }}>
      <Cloudscape colorBottom="#a8c8e8" colorMid="#d4e8d4" colorTop="#e8e4f0" speed={1.2} height="100dvh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100dvh" }} />

      <div className="relative mx-auto w-full max-w-[720px]">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <span className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
            style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}>
            Pitch<span style={{ color: "var(--color-hudson-blue)" }}>Ready</span>
          </span>

          {hasDeckFile && (
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-[500] text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--color-obsidian)", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              {downloading ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 14 14" style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Preparing…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .pptx
                </>
              )}
            </button>
          )}
        </div>

        {/* Company + status */}
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-[400] leading-[1.1] tracking-[-0.56px] sm:text-[36px]"
              style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}>
              {companyName}
            </h1>
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-[600]"
              style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: badge.color, display: "inline-block", flexShrink: 0 }} />
              {badge.label}
            </span>
          </div>
          <p className="text-[13px]" style={{ color: "var(--color-steel)" }}>
            {hasSlides
              ? `${slides.length} slides · Investor pitch deck`
              : "Your deck is being generated — check back shortly."}
          </p>
        </div>

        {/* No slides yet — waiting state */}
        {!hasSlides && (
          <div className="rounded-[16px] p-10 text-center"
            style={{
              background: "rgba(255,255,255,0.72)", backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)",
            }}>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(0,129,192,0.08)", border: "1px solid rgba(0,129,192,0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-hudson-blue)" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="mb-2 text-[16px] font-[500]" style={{ color: "var(--color-ink)" }}>AI is drafting your deck</p>
            <p className="text-[13px] leading-[1.6]" style={{ color: "var(--color-steel)" }}>
              This usually takes 1–2 minutes. Refresh the page to check for updates.
            </p>
            <button onClick={() => window.location.reload()}
              className="mt-5 rounded-[8px] px-5 py-2 text-[13px] font-[500] transition-opacity hover:opacity-80"
              style={{ background: "var(--color-ink)", color: "white" }}>
              Refresh
            </button>
          </div>
        )}

        {/* Slide viewer */}
        {hasSlides && (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

            {/* Sidebar nav */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:w-[180px] lg:flex-col lg:overflow-x-visible lg:pb-0">
              {slides.map((slide, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className="flex shrink-0 items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12px] transition-all lg:w-full"
                  style={{
                    background: i === activeIdx ? "rgba(0,129,192,0.1)" : "rgba(255,255,255,0.5)",
                    border: i === activeIdx ? "1px solid rgba(0,129,192,0.3)" : "1px solid rgba(255,255,255,0.6)",
                    color: i === activeIdx ? "var(--color-hudson-blue)" : "var(--color-iron)",
                    fontWeight: i === activeIdx ? 600 : 400,
                    backdropFilter: "blur(8px)",
                    whiteSpace: "nowrap",
                  }}>
                  <span style={{ color: i === activeIdx ? "var(--color-hudson-blue)" : "var(--color-steel)", flexShrink: 0 }}>
                    {SLIDE_TYPE_ICONS[slide.slideType]}
                  </span>
                  <span className="hidden lg:inline">{SLIDE_TYPE_LABELS[slide.slideType] ?? slide.slideType}</span>
                  <span className="lg:hidden">{i + 1}</span>
                </button>
              ))}
            </div>

            {/* Main slide card */}
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden rounded-[16px]"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(24px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.08)",
                }}>

                {/* Slide type label bar */}
                <div className="flex items-center gap-2 border-b px-6 py-3"
                  style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <span style={{ color: "var(--color-hudson-blue)" }}>
                    {SLIDE_TYPE_ICONS[activeSlide.slideType]}
                  </span>
                  <span className="text-[11px] font-[600] uppercase tracking-[0.12em]"
                    style={{ color: "var(--color-iron)" }}>
                    {SLIDE_TYPE_LABELS[activeSlide.slideType] ?? activeSlide.slideType}
                  </span>
                  <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--color-steel)" }}>
                    {activeIdx + 1} / {slides.length}
                  </span>
                </div>

                {/* Slide content */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={activeIdx} custom={direction}
                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="px-6 py-8 sm:px-8 sm:py-10">

                    <h2 className="mb-6 text-[22px] font-[400] leading-[1.2] tracking-[-0.4px] sm:text-[28px]"
                      style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}>
                      {activeSlide.title}
                    </h2>

                    <ul className="space-y-3">
                      {activeSlide.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.6]"
                          style={{ color: "var(--color-iron)" }}>
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: "var(--color-hudson-blue)" }} />
                          {bullet}
                        </li>
                      ))}
                    </ul>

                    {activeSlide.speakerNotes && (
                      <div className="mt-8 rounded-[8px] px-4 py-3"
                        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <p className="mb-1 text-[10px] font-[600] uppercase tracking-[0.1em]"
                          style={{ color: "var(--color-steel)" }}>Speaker notes</p>
                        <p className="text-[13px] leading-[1.6]" style={{ color: "var(--color-iron)" }}>
                          {activeSlide.speakerNotes}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next */}
                <div className="flex items-center justify-between border-t px-6 py-3"
                  style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <button onClick={prev} disabled={activeIdx === 0}
                    className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-[500] transition-opacity disabled:opacity-30"
                    style={{ color: "var(--color-iron)", background: "rgba(0,0,0,0.04)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  <button onClick={next} disabled={activeIdx === slides.length - 1}
                    className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-[500] transition-opacity disabled:opacity-30"
                    style={{ color: "var(--color-iron)", background: "rgba(0,0,0,0.04)" }}>
                    Next
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Download CTA below card if no file yet */}
              {!hasDeckFile && (
                <p className="mt-4 text-center text-[12px]" style={{ color: "var(--color-steel)" }}>
                  The final .pptx file will appear here once our CFO finalises the deck.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
