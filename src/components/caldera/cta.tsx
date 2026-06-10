export function CalderaCTA({
  onGetStarted,
  loading,
  error,
}: {
  onGetStarted: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section id="get-started" className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-[12px] sm:rounded-[16px]">
        {/* Background image — full, uncropped */}
        <img
          src="/CTA.png"
          alt=""
          aria-hidden
          className="block w-full"
          style={{ minHeight: "280px", objectFit: "cover" }}
        />

        {/* Scrim — stronger on mobile for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
          }}
        />

        {/* Content — top left, overlaid */}
        <div className="absolute inset-0 z-10 flex flex-col items-start gap-3 p-6 sm:gap-4 sm:p-8 lg:p-10">
          <span
            className="text-[10px] font-[600] uppercase tracking-[0.14em] text-white/50 sm:text-[11px]"
            style={{ fontFamily: "var(--font-af)" }}
          >
            Get started
          </span>

          <h2
            className="text-[20px] font-[400] leading-[1.15] tracking-[-0.4px] text-white sm:text-[22px] lg:text-[26px]"
            style={{
              fontFamily: "var(--font-ppmondwest)",
              fontFeatureSettings: '"liga" 0',
            }}
          >
            Ready to raise
            <br />
            your Series A?
          </h2>

          <p
            className="max-w-[240px] text-[12px] font-[400] leading-[1.6] text-white/60 sm:max-w-[280px] sm:text-[13px]"
            style={{ fontFamily: "var(--font-af)" }}
          >
            CFO-reviewed pitch deck and written report in 5–7 business days. No account needed.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1" style={{ fontFamily: "var(--font-af)" }}>
            <button
              onClick={onGetStarted}
              disabled={loading}
              className="gic-spring rounded-[4px] px-4 py-2 text-[13px] font-[500] disabled:opacity-50"
              style={{
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                color: "white",
              }}
            >
              {loading ? "Loading…" : "Get your pitch deck →"}
            </button>
            <a
              href="#how-it-works"
              className="text-[13px] font-[400] text-white/60 underline underline-offset-4 transition-colors hover:text-white"
              style={{ textDecorationColor: "rgba(255,255,255,0.2)" }}
            >
              See how it works
            </a>
          </div>

          {error && (
            <p
              className="text-[12px] text-[var(--color-slate-cyan)]"
              style={{ fontFamily: "var(--font-af)" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
