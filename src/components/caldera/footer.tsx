const cols = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "What you get", href: "/#what-you-get" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "mailto:hello@pitchready.co" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
];

export function CalderaFooter() {
  return (
    <footer
      id="faq"
      className="px-4 py-16 sm:px-8 sm:py-[80px]"
      style={{ background: "var(--color-graphite-night)" }}
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div
          className="grid grid-cols-2 gap-8 border-t pt-10 sm:gap-10 sm:pt-12 lg:grid-cols-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
            <span
              className="text-[15px] font-[500] text-white"
              style={{ fontFamily: "var(--font-af)" }}
            >
              Pitch<span style={{ color: "var(--color-slate-cyan)" }}>Ready</span>
            </span>
            <p
              className="text-[13px] font-[400] leading-[1.5] text-white/50"
              style={{ fontFamily: "var(--font-af)" }}
            >
              CFO-reviewed Series A pitch decks,
              <br />
              delivered in 5–7 business days.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <span
                className="text-[12px] font-[500] uppercase tracking-[0.06em] text-white/40 sm:text-[13px]"
                style={{ fontFamily: "var(--font-af)" }}
              >
                {c.title}
              </span>
              {c.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="gic-underline text-[13px] font-[400] text-white/60 transition-colors hover:text-[var(--color-slate-cyan)] sm:text-[14px]"
                  style={{ fontFamily: "var(--font-af)", textDecoration: "none" }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <p
          className="mt-10 text-[12px] font-[400] uppercase tracking-[0.06em] text-white/30 sm:mt-12 sm:text-[13px]"
          style={{ fontFamily: "var(--font-af)" }}
        >
          © {new Date().getFullYear()} PitchReady. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
