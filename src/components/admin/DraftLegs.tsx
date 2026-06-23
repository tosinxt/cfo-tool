import { DRAFT_STAGES } from "@/lib/ai/types";
import type { DraftProgress } from "@/lib/ai/types";

interface CompactProps {
  progress: DraftProgress | null | undefined;
}

/** Single-line "Leg 2/4 · Drafting deck outline" — for table rows. */
export function DraftLegsCompact({ progress }: CompactProps) {
  if (!progress) {
    return <span className="text-[11px] text-gray-400">Starting…</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[oklch(50%_0.12_240)]">
      <svg className="animate-spin h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Leg {progress.stageIndex + 1}/{progress.totalStages} · {progress.label}
    </span>
  );
}

interface FullProps {
  progress: DraftProgress | null | undefined;
}

/** Full horizontal numbered stepper — for the engagement detail banner. */
export function DraftLegsFull({ progress }: FullProps) {
  const currentIdx = Math.max(progress?.stageIndex ?? 0, 0);

  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {DRAFT_STAGES.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={stage.id} className="flex items-center shrink-0">
            {i > 0 && (
              <span
                className="h-px w-6"
                style={{ background: i <= currentIdx ? "oklch(62% 0.12 240)" : "oklch(85% 0.01 250)" }}
              />
            )}
            <div className="flex items-center gap-1.5 px-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-[oklch(60%_0.12_150)] text-white"
                    : active
                    ? "bg-[oklch(62%_0.12_240)] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-90" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`whitespace-nowrap text-[12px] ${
                  active ? "font-semibold text-[oklch(45%_0.13_75)]" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {stage.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
