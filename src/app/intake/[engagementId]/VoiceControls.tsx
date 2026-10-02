"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, Trash2 } from "lucide-react";
import { LIVE_BARS, formatDuration } from "./useVoiceRecorder";

export function IconButton({
  label,
  title,
  onClick,
  disabled,
  primary,
  danger,
  type = "button",
  children,
}: {
  label: string;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  type?: "button" | "submit";
  children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title ?? label}
      className={`flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-hudson-deep)] disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "bg-[var(--color-hudson-deep)] text-white hover:bg-[#00668f]"
          : danger
            ? "text-[var(--color-steel)] hover:bg-red-50 hover:text-[#b91c1c]"
            : "text-[var(--color-iron)] hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

export function RecordingBar({
  seconds,
  levels,
  onCancel,
  onSend,
}: {
  seconds: number;
  levels: number[];
  onCancel: () => void;
  onSend: () => void;
}) {
  const reduceMotion = useReducedMotion();
  // Newest sample on the right; pad the left so the wave scrolls in from the right.
  const bars = [...Array(Math.max(0, LIVE_BARS - levels.length)).fill(0), ...levels];
  return (
    <>
      <IconButton label="Discard recording" onClick={onCancel} danger>
        <Trash2 size={20} />
      </IconButton>
      <div
        className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full px-4"
        style={{ background: "rgba(255,255,255,0.92)", border: "1px solid #b8bdb8" }}
        role="status"
        aria-label={`Recording, ${formatDuration(seconds)}`}
      >
        <motion.span
          aria-hidden
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ background: "#dc2626" }}
          animate={reduceMotion ? undefined : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="flex-shrink-0 text-[13px] tabular-nums" style={{ color: "var(--color-ink)" }}>
          {formatDuration(seconds)}
        </span>
        <div aria-hidden className="flex h-7 min-w-0 flex-1 items-center justify-end gap-[2px] overflow-hidden">
          {bars.map((level, i) => (
            <span
              key={i}
              className="w-[3px] flex-shrink-0 rounded-full"
              style={{
                height: `${Math.max(3, level * 28)}px`,
                background: "var(--color-ink)",
                opacity: level > 0 ? 0.85 : 0.2,
                transition: "height 60ms linear",
              }}
            />
          ))}
        </div>
      </div>
      <IconButton label="Send voice note" onClick={onSend} primary>
        <ArrowUp size={20} />
      </IconButton>
    </>
  );
}
