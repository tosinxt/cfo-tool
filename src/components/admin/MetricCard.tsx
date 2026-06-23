import { Sparkline } from "./Sparkline";

export function MetricCard({
  label,
  value,
  hero = false,
  context,
  sparkline,
}: {
  label: string;
  value: string;
  hero?: boolean;
  context?: string;
  sparkline?: number[];
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-2 ${
        hero
          ? "border-hudson-blue/20 bg-hudson-blue/5"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
        {sparkline && sparkline.length > 1 && (
          <Sparkline
            data={sparkline}
            className={hero ? "text-hudson-blue" : "text-gray-400"}
          />
        )}
      </div>
      <p
        className={`font-mono [font-variant-numeric:tabular-nums] tracking-tight ${
          hero ? "text-[32px] text-hudson-blue font-semibold" : "text-[24px] text-gray-900 font-semibold"
        }`}
      >
        {value}
      </p>
      {context && <p className="text-[12px] text-gray-400">{context}</p>}
    </div>
  );
}
