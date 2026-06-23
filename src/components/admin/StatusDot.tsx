import type { EngagementStatus } from "@/lib/types";

const CONFIG: Record<EngagementStatus, { label: string; dot: string; text: string }> = {
  paid: { label: "Paid", dot: "bg-gray-400", text: "text-gray-600" },
  awaiting_intake: { label: "Awaiting intake", dot: "bg-gray-400", text: "text-gray-600" },
  drafting: { label: "Drafting", dot: "bg-[oklch(62%_0.12_240)]", text: "text-[oklch(50%_0.12_240)]" },
  ready_for_review: { label: "Ready for review", dot: "bg-[oklch(72%_0.13_75)]", text: "text-[oklch(50%_0.13_75)]" },
  approved: { label: "Approved", dot: "bg-[oklch(60%_0.12_150)]", text: "text-[oklch(45%_0.12_150)]" },
  delivered: { label: "Delivered", dot: "bg-hudson-blue", text: "text-hudson-blue" },
};

export function StatusDot({ status }: { status: EngagementStatus }) {
  const cfg = CONFIG[status] ?? { label: status, dot: "bg-gray-400", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export const STATUS_ORDER: EngagementStatus[] = [
  "paid",
  "awaiting_intake",
  "drafting",
  "ready_for_review",
  "approved",
  "delivered",
];

export const STATUS_LABEL: Record<EngagementStatus, string> = Object.fromEntries(
  Object.entries(CONFIG).map(([k, v]) => [k, v.label])
) as Record<EngagementStatus, string>;
