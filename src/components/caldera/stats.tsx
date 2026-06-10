const stats = [
  { label: "Decks delivered", value: "80+" },
  { label: "Capital raised by clients", value: "$200M+" },
  { label: "Average raise size", value: "$8M" },
  { label: "Days to delivery", value: "5–7" },
];

export function CalderaStats() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <div
        className="grid grid-cols-2 gap-[1px] overflow-hidden rounded-[12px] lg:grid-cols-4"
        style={{ background: "var(--color-sage)" }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="gic-stat-group gic-lift flex flex-col gap-2 bg-[var(--color-paper)] p-4 sm:gap-3 sm:p-[16px]"
          >
            <span
              className="text-[12px] font-[400] leading-[1.4] tracking-[-0.1px] text-[var(--color-steel)] sm:text-[13px]"
              style={{ fontFamily: "var(--font-af)" }}
            >
              {s.label}
            </span>
            <span
              className="gic-stat-number text-[32px] font-[400] leading-[1.1] tracking-[-0.64px] text-[var(--color-ink)] sm:text-[40px]"
              style={{
                fontFamily: "var(--font-ppmondwest)",
                fontFeatureSettings: '"liga" 0',
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
