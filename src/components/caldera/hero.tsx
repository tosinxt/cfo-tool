export function CalderaHero({
  onGetStarted,
  loading,
}: {
  onGetStarted: () => void;
  loading: boolean;
}) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Full-bleed painted illustration */}
      <img
        src="/hero.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Mobile: gradient scrim from bottom so text is readable */}
      <div
        className="absolute inset-0 sm:hidden"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
        }}
      />

      {/* Mobile layout — bottom of screen, full-width */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 p-6 pb-10 sm:hidden">
        <h1
          className="text-[36px] font-[400] leading-[1.08] tracking-[-0.72px] text-white"
          style={{
            fontFamily: "var(--font-ppmondwest)",
            fontFeatureSettings: '"liga" 0',
          }}
        >
          Your Series A pitch deck, perfected.
        </h1>
        <p
          className="text-[14px] font-[400] leading-[1.55] text-white/70"
          style={{ fontFamily: "var(--font-af)" }}
        >
          A CFO-reviewed, investor-ready pitch deck and written report — built
          from your intake, delivered in 5–7 business days.
        </p>
        <div className="flex flex-wrap items-center gap-3" style={{ fontFamily: "var(--font-af)" }}>
          <button
            onClick={onGetStarted}
            disabled={loading}
            className="gic-spring rounded-[4px] px-5 py-2.5 text-[15px] font-[500] text-white disabled:opacity-50"
            style={{
              background: "rgba(0,174,239,0.15)",
              border: "1px solid rgba(0,174,239,0.45)",
              backdropFilter: "blur(8px)",
              color: "var(--color-slate-cyan)",
            }}
          >
            {loading ? "Loading…" : "Get Started →"}
          </button>
          <a
            href="#how-it-works"
            className="text-[14px] font-[400] text-white/60 underline underline-offset-4"
            style={{ textDecorationColor: "rgba(255,255,255,0.2)" }}
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Desktop: frosted glass card — lower left */}
      <div
        className="absolute bottom-12 left-8 hidden max-w-[520px] rounded-[24px] p-7 sm:flex sm:flex-col"
        style={{
          background: "rgba(10, 10, 20, 0.45)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <h1
          className="mb-4 text-[48px] font-[400] leading-[1.08] tracking-[-0.96px] text-white"
          style={{
            fontFamily: "var(--font-ppmondwest)",
            fontFeatureSettings: '"liga" 0',
          }}
        >
          Your Series A pitch deck, perfected.
        </h1>

        <p
          className="mb-6 text-[15px] font-[400] leading-[1.55] tracking-[-0.15px] text-white/70"
          style={{ fontFamily: "var(--font-af)" }}
        >
          A CFO-reviewed, investor-ready pitch deck and written report — built
          from your intake, delivered in 5–7 business days.
        </p>

        <div className="flex items-center gap-4" style={{ fontFamily: "var(--font-af)" }}>
          <button
            onClick={onGetStarted}
            disabled={loading}
            className="rounded-[4px] px-5 py-2.5 text-[15px] font-[500] transition-all disabled:opacity-50"
            style={{
              background: "rgba(0,174,239,0.12)",
              border: "1px solid rgba(0,174,239,0.40)",
              backdropFilter: "blur(8px)",
              color: "var(--color-slate-cyan)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,174,239,0.22)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,174,239,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,174,239,0.12)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,174,239,0.40)";
            }}
          >
            {loading ? "Loading…" : "Get Started →"}
          </button>
          <a
            href="#how-it-works"
            className="text-[15px] font-[400] text-white/60 underline underline-offset-4 transition-colors hover:text-white/90"
            style={{ textDecorationColor: "rgba(255,255,255,0.2)" }}
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
