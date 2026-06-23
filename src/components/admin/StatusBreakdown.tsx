import { STATUS_ORDER, STATUS_LABEL } from "./StatusDot";
import type { EngagementStatus } from "@/lib/types";

export function StatusBreakdown({ counts }: { counts: Record<EngagementStatus, number> }) {
  const total = STATUS_ORDER.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const max = Math.max(...STATUS_ORDER.map((s) => counts[s] ?? 0), 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-[12px] font-medium text-gray-500 mb-3">Pipeline by status</p>
      <div className="flex flex-col gap-2.5">
        {STATUS_ORDER.map((status) => {
          const count = counts[status] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="text-[12px] text-gray-600 w-[120px] shrink-0 truncate">
                {STATUS_LABEL[status]}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-hudson-blue/70"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="font-mono [font-variant-numeric:tabular-nums] text-[12px] text-gray-500 w-[42px] text-right shrink-0">
                {count} <span className="text-gray-300">·</span> {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
