import type { EngagementStatus } from "@/lib/types";

const CONFIG: Record<
  EngagementStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className: "bg-gray-100 text-gray-600",
  },
  awaiting_intake: {
    label: "Awaiting Intake",
    className: "bg-gray-100 text-gray-600",
  },
  drafting: {
    label: "Drafting",
    className: "bg-blue-100 text-blue-700",
  },
  ready_for_review: {
    label: "Ready for Review",
    className: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700",
  },
  delivered: {
    label: "Delivered",
    className: "bg-teal-100 text-teal-700",
  },
};

export function StatusBadge({ status }: { status: EngagementStatus }) {
  const { label, className } = CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
