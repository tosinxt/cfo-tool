const items = [
  "Pitch deck",
  "Financial narrative",
  "Market sizing",
  "Team story",
  "Use of funds",
  "Investor readiness",
  "Traction framing",
  "Valuation rationale",
];

export function CalderaMarquee() {
  const track = [...items, ...items];
  return (
    <div
      className="overflow-hidden border-y py-4 sm:py-[20px]"
      style={{ borderColor: "var(--color-sage)", background: "var(--color-cream)" }}
    >
      <div className="gic-marquee-track">
        {track.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-5 flex items-center gap-5 whitespace-nowrap text-[28px] font-[400] leading-none tracking-[-0.56px] text-[var(--color-ink)] sm:mx-[35px] sm:gap-[35px] sm:text-[40px]"
            style={{
              fontFamily: "var(--font-ppmondwest)",
              fontFeatureSettings: '"liga" 0',
            }}
          >
            {item}
            <span className="h-[6px] w-[6px] rounded-full bg-[var(--color-hudson-blue)] sm:h-[8px] sm:w-[8px]" />
          </span>
        ))}
      </div>
    </div>
  );
}
