"use client";

/**
 * Presentational intake widgets, shared by the bank-driven renderer.
 *
 * Extracted verbatim from the original six-step IntakeForm so the visual
 * design is preserved exactly; only the form generic was widened, because the
 * question bank keys answers by question id rather than a fixed field union.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useController, useWatch, type UseFormReturn } from "react-hook-form";
import { AnimatedCheckmarkCircle } from "@/components/forgeui/animated-form";
import {
  MARKET_KEYS,
  parseMarketSize,
  serializeMarketSize,
  METRIC_PLACEHOLDERS,
  parseMetrics,
  serializeMetrics,
  parseProjections,
  serializeProjections,
  onlyDigits,
  formatThousands,
  normalizeMoney,
  abbreviateMoney,
  parseAllocations,
  serializeAllocations,
  type MetricRowData,
  type AllocRow,
} from "@/lib/intake/composites";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyForm = UseFormReturn<Record<string, any>>;

export const CIRCLE_LEN = 2 * Math.PI * 7; // r=7 matches AnimatedCheckmarkCircle

export function FieldCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="check"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <AnimatedCheckmarkCircle
            circleLength={CIRCLE_LEN}
            strokeDuration={0.4}
            strokeDelay={0}
            fillDelay={0.28}
            checkmarkDelay={0.32}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Why hint tooltip ─────────────────────────────────────────────────────────

export function WhyHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen(v => !v)}
        aria-label="Why do we ask this?"
        title="Why do we ask this?"
        style={{
          width: "18px", height: "18px", borderRadius: "50%",
          background: open ? "rgba(0,129,192,0.12)" : "rgba(0,0,0,0.06)",
          border: open ? "1px solid rgba(0,129,192,0.3)" : "1px solid rgba(0,0,0,0.10)",
          cursor: "pointer", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          transition: "background 150ms, border-color 150ms",
          flexShrink: 0,
        }}
      >
        {/* ⓘ icon */}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4.5" stroke={open ? "var(--color-hudson-blue)" : "#888"} strokeWidth="1"/>
          <rect x="4.4" y="4.2" width="1.2" height="3.3" rx="0.5" fill={open ? "var(--color-hudson-blue)" : "#888"}/>
          <circle cx="5" cy="2.8" r="0.65" fill={open ? "var(--color-hudson-blue)" : "#888"}/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
              width: "220px", padding: "8px 10px", borderRadius: "8px",
              background: "var(--color-ink)", color: "rgba(255,255,255,0.85)",
              fontSize: "11px", lineHeight: "1.5", fontFamily: "var(--font-af)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

export function Field({
  label, hint, error, htmlFor, children, required, why, emphasis = "normal", trailing,
}: {
  label: string; hint?: string; error?: string; htmlFor?: string;
  children: React.ReactNode; required?: boolean; why?: string;
  /** "lead" gives narrative questions a larger label and more breathing room. */
  emphasis?: "normal" | "lead";
  trailing?: React.ReactNode;
}) {
  const lead = emphasis === "lead";
  return (
    <div className="flex flex-col gap-1.5">
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <label
          htmlFor={htmlFor}
          style={{
            color: "var(--color-ink)",
            fontFamily: "var(--font-af)",
            fontWeight: lead ? 600 : 500,
            fontSize: lead ? "16px" : "13px",
            lineHeight: 1.35,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </label>
        {/* Most questions are required, so marking the few OPTIONAL ones
            carries information where a wall of red asterisks would not. */}
        {!required && (
          <span
            style={{
              fontSize: "11px", color: "var(--color-steel)", fontWeight: 500,
              letterSpacing: "0.02em", flexShrink: 0,
            }}
          >
            Optional
          </span>
        )}
        {why && <WhyHint text={why} />}
        {trailing && <div style={{ marginLeft: "auto" }}>{trailing}</div>}
      </div>
      {hint && (
        <p className="text-[12px]" style={{ color: "var(--color-steel)", fontFamily: "var(--font-af)", lineHeight: 1.55 }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-[12px]"
          style={{ color: "#b91c1c", display: "flex", alignItems: "center", gap: "5px" }}
          role="alert" aria-live="polite"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7.5v5M12 16h.01" />
          </svg>
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Input adornment wrapper ──────────────────────────────────────────────────

export function InputGroupWithSuffix({ suffix, children }: { suffix: string; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  const [valid, setValid] = useState(false);

  const borderColor = focused ? "var(--color-hudson-blue)" : valid ? "#22c55e" : "#b8bdb8";

  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> & { valid?: boolean; onFocus?: React.FocusEventHandler; onBlur?: React.FocusEventHandler }>, {
        style: {
          ...(children as React.ReactElement<{ style?: React.CSSProperties }>).props.style,
          borderTopRightRadius: 0, borderBottomRightRadius: 0,
          borderRight: "none",
        },
        onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
          setFocused(true);
          (children as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>).props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
          setFocused(false);
          const isValid = !!(children as React.ReactElement<{ valid?: boolean }>).props.valid;
          setValid(isValid);
          (children as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>).props.onBlur?.(e);
        },
      })
    : children;

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <div style={{ flex: 1, minWidth: 0 }}>{child}</div>
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 14px",
        background: "rgba(248,249,248,0.95)",
        border: `1px solid ${borderColor}`,
        borderLeft: "none",
        borderTopRightRadius: "6px", borderBottomRightRadius: "6px",
        color: "var(--color-iron)", fontSize: "13px",
        fontFamily: "var(--font-af)", whiteSpace: "nowrap",
        userSelect: "none", flexShrink: 0,
        transition: "border-color 0.15s",
      }}>{suffix}</span>
    </div>
  );
}

// ─── Slider input ─────────────────────────────────────────────────────────────

const sliderCss = `
.pr-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 9999px; outline: none; cursor: pointer; background: transparent; touch-action: pan-y; }
.pr-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: white; border: 2px solid var(--color-hudson-blue); box-shadow: 0 2px 6px rgba(0,129,192,0.22), 0 1px 3px rgba(0,0,0,0.12); cursor: grab; transition: transform 0.1s, box-shadow 0.1s; }
.pr-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); box-shadow: 0 3px 10px rgba(0,129,192,0.32); }
.pr-slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: white; border: 2px solid var(--color-hudson-blue); box-shadow: 0 2px 6px rgba(0,129,192,0.22); cursor: grab; }
.pr-slider:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px rgba(0,129,192,0.22); }
`;

type SliderInputProps = {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ticks?: number[];
  id?: string;
  placeholder?: string;
  valid?: boolean;
};

export function SliderInput({ value, onChange, onBlur, min, max, step = 1, unit, ticks, id, placeholder, valid }: SliderInputProps) {
  const [focused, setFocused] = useState(false);
  const numVal = parseFloat(value) || 0;
  const pct = Math.min(Math.max((numVal - min) / (max - min), 0), 1) * 100;

  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(to right, var(--color-hudson-blue) ${pct}%, #d4d9d4 ${pct}%)`,
  };

  return (
    <>
      <style>{sliderCss}</style>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); onBlur?.(); }}
            style={{
              ...inputBase,
              borderTopRightRadius: unit ? 0 : "6px",
              borderBottomRightRadius: unit ? 0 : "6px",
              borderRight: unit ? "none" : "1px solid",
              borderColor: focused ? "var(--color-hudson-blue)" : valid ? "#22c55e" : "#b8bdb8",
              boxShadow: focused ? "0 0 0 3px rgba(0,129,192,0.10)" : valid ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
              paddingRight: valid ? "36px" : "14px",
            }}
          />
          <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <FieldCheck show={!!valid && !focused} />
          </div>
        </div>
        {unit && (
          <span style={{
            display: "flex", alignItems: "center", padding: "0 14px",
            background: "rgba(248,249,248,0.95)",
            border: `1px solid ${focused ? "var(--color-hudson-blue)" : valid ? "#22c55e" : "#b8bdb8"}`,
            borderLeft: "none", borderTopRightRadius: "6px", borderBottomRightRadius: "6px",
            color: "var(--color-iron)", fontSize: "13px", fontFamily: "var(--font-af)",
            whiteSpace: "nowrap", flexShrink: 0, transition: "border-color 0.15s",
          }}>{unit}</span>
        )}
      </div>

      {/* Track */}
      <div style={{ marginTop: "10px", paddingBottom: ticks ? "4px" : "0" }}>
        <input
          type="range"
          className="pr-slider"
          min={min} max={max} step={step}
          value={isNaN(numVal) ? min : Math.min(Math.max(numVal, min), max)}
          onChange={e => onChange(e.target.value)}
          style={trackStyle}
          aria-label={unit ? `${id} slider` : id}
        />
        {ticks && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            {ticks.map(t => (
              <span key={t} style={{ fontSize: "11px", color: "#8a908a", fontFamily: "var(--font-af)", fontVariantNumeric: "tabular-nums" }}>
                {t}{unit === "months" ? "m" : unit === "%" ? "%" : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function InputAdornment({ prefix, suffix, children }: { prefix?: string; suffix?: string; children: React.ReactNode }) {
  if (!prefix && !suffix) return <>{children}</>;

  // Suffix uses an attached addon pill (Stripe/GitHub pattern) — separate from input border
  if (suffix) {
    return (
      <InputGroupWithSuffix suffix={suffix}>{children}</InputGroupWithSuffix>
    );
  }

  // Prefix stays as an inline overlay ($ symbol is too short for an addon)
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "stretch" }}>
      <span style={{
        position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
        color: "var(--color-iron)", fontSize: "14px", fontFamily: "var(--font-af)", pointerEvents: "none", zIndex: 1,
      }}>{prefix}</span>
      <div style={{ flex: 1 }}>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ style?: React.CSSProperties }>, {
              style: {
                ...(children as React.ReactElement<{ style?: React.CSSProperties }>).props.style,
                paddingLeft: "28px",
              },
            })
          : children}
      </div>
    </div>
  );
}

// ─── Styled inputs ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  fontFamily: "var(--font-af)", fontSize: "16px", color: "var(--color-ink)",
  background: "rgba(255,255,255,0.92)", border: "1px solid #b8bdb8",
  borderRadius: "6px", padding: "11px 14px", width: "100%",
  outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
  height: "48px", boxSizing: "border-box", touchAction: "manipulation",
};

export const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { valid?: boolean }>(
  function StyledInput({ valid, ...props }, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ position: "relative" }}>
        <input
          {...props}
          ref={ref}
          style={{
            ...inputBase,
            ...props.style,
            borderColor: focused ? "var(--color-hudson-blue)" : valid ? "#22c55e" : "#b8bdb8",
            boxShadow: focused ? "0 0 0 3px rgba(0,129,192,0.10)" : valid ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
            paddingRight: valid ? "36px" : "14px",
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <FieldCheck show={!!valid && !focused} />
        </div>
      </div>
    );
  }
);

export const StyledTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { valid?: boolean }>(
  function StyledTextarea({ valid, ...props }, forwardedRef) {
    const [focused, setFocused] = useState(false);
    const innerRef = useRef<HTMLTextAreaElement>(null);

    const setRefs = useCallback((el: HTMLTextAreaElement | null) => {
      (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      if (typeof forwardedRef === "function") forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    }, [forwardedRef]);

    const autoResize = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => { autoResize(); }, [props.value, autoResize]);

    return (
      <textarea
        {...props}
        ref={setRefs}
        style={{
          ...inputBase,
          height: undefined,
          minHeight: "80px",
          ...props.style,
          resize: "none",
          overflow: "hidden",
          borderColor: focused ? "var(--color-hudson-blue)" : valid ? "#22c55e" : "#b8bdb8",
          boxShadow: focused ? "0 0 0 3px rgba(0,129,192,0.10)" : valid ? "0 0 0 3px rgba(34,197,94,0.08)" : "none",
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        onChange={(e) => { props.onChange?.(e); autoResize(); }}
      />
    );
  }
);

export const StyledSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function StyledSelect(props, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <select
        {...props}
        ref={ref}
        style={{
          ...inputBase,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "40px",
          borderColor: focused ? "var(--color-hudson-blue)" : "#b8bdb8",
          boxShadow: focused ? "0 0 0 3px rgba(0,129,192,0.10)" : "none",
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    );
  }
);

// ─── Character count ring ─────────────────────────────────────────────────────

export function CharRing({ current, max, min }: { current: number; max: number; min?: number }) {
  const r = 8; const circ = 2 * Math.PI * r;
  // Below the required minimum the ring fills toward `min`, so the founder
  // sees the bar to clear before Continue rejects the answer.
  const belowMin = !!min && current < min;
  const pct = belowMin ? Math.min(1, current / (min as number)) : Math.min(1, current / max);
  const over = current > max;
  const untouched = belowMin && current === 0;
  const color = over ? "#dc2626"
    : untouched ? "#c4c9c4"
    : belowMin ? "#f59e0b"
    : pct > 0.85 ? "#f59e0b"
    : "var(--color-hudson-blue)";
  const label = belowMin
    ? (untouched ? `at least ${min} characters` : `${current} / min ${min}`)
    : `${current}/${max}`;
  const labelColor = over ? "#dc2626" : untouched ? "#8a908a" : belowMin ? "#b45309" : "#5a5f5a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", justifyContent: "flex-end", marginTop: "5px" }}>
      <svg width="20" height="20" style={{ transform: "rotate(-90deg)" }}>
        {/* Always-visible base track */}
        <circle cx="10" cy="10" r={r} fill="none" stroke="#e2e5e2" strokeWidth="2" />
        <motion.circle
          cx="10" cy="10" r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.2 }}
          style={{ strokeLinecap: "round" }}
        />
      </svg>
      <span style={{ fontSize: "11px", fontFamily: "var(--font-af)", color: labelColor, fontVariantNumeric: "tabular-nums" }}>
        {label}
      </span>
    </div>
  );
}

/** Textarea with live character count ring. `minRequired` stays a custom prop
 * (not the native minLength attr) so the browser's own validation tooltip
 * never fires — the ring communicates the requirement instead. */
export const CharTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength: number; currentLength: number; minRequired?: number; valid?: boolean }
>(function CharTextarea({ maxLength, currentLength, minRequired, valid, ...props }, ref) {
  return (
    <div>
      <StyledTextarea {...props} ref={ref} valid={valid} />
      <CharRing current={currentLength} max={maxLength} min={minRequired} />
    </div>
  );
});

// ─── Shared UI primitives ─────────────────────────────────────────────────────

export function QuickChips({ chips, onSelect }: { chips: string[]; onSelect: (chip: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
      {chips.map((chip) => (
        <button
          key={chip} type="button" onClick={() => onSelect(chip)}
          style={{
            padding: "6px 12px", borderRadius: "50px", fontSize: "12px",
            fontFamily: "var(--font-af)", color: "var(--color-iron)",
            border: "1px solid #b0b5b0", background: "transparent", cursor: "pointer",
            transition: "color 150ms, border-color 150ms, background 150ms",
            minHeight: "32px",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = "var(--color-hudson-blue)";
            el.style.borderColor = "rgba(0,129,192,0.4)";
            el.style.background = "rgba(0,129,192,0.05)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = "var(--color-iron)";
            el.style.borderColor = "#b0b5b0";
            el.style.background = "transparent";
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

// Shared pill styling — sector chips, stage pills, and slider presets must
// all read as one system.
export function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 14px", borderRadius: "50px", fontSize: "13px",
    fontFamily: "var(--font-af)", cursor: "pointer",
    transition: "all 150ms",
    fontWeight: active ? 600 : 400,
    color: active ? "var(--color-hudson-blue)" : "var(--color-steel)",
    border: active ? "1.5px solid var(--color-hudson-blue)" : "1px solid #b0b5b0",
    background: active ? "rgba(0,129,192,0.08)" : "transparent",
    minHeight: "36px",
  };
}

// ─── PillSelect: chip grid + "Other" reveals text input ──────────────────────

export function PillSelect({
  chips, value, onChange, placeholder, id, valid,
}: {
  chips: string[]; value: string; onChange: (v: string) => void;
  placeholder?: string; id?: string; valid?: boolean;
}) {
  const isOther = value.length > 0 && !chips.includes(value);
  const [showOther, setShowOther] = useState(isOther);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showOther) inputRef.current?.focus();
  }, [showOther]);

  function selectChip(chip: string) {
    setShowOther(false);
    onChange(chip);
  }

  function openOther() {
    setShowOther(true);
    onChange("");
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {chips.map((chip) => {
          const active = value === chip && !showOther;
          return (
            <button
              key={chip} type="button" onClick={() => selectChip(chip)}
              style={chipStyle(active)}
            >
              {chip}
            </button>
          );
        })}
        <button
          type="button" onClick={openOther}
          style={chipStyle(showOther)}
        >
          Other
        </button>
      </div>
      <AnimatePresence>
        {showOther && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <input
              ref={inputRef}
              id={id}
              type="text"
              value={value}
              placeholder={placeholder ?? "Type your answer…"}
              onChange={(e) => onChange(e.target.value)}
              style={{
                ...inputBase,
                borderColor: valid ? "#22c55e" : "var(--color-hudson-blue)",
                boxShadow: valid ? "0 0 0 3px rgba(34,197,94,0.08)" : "0 0 0 3px rgba(0,129,192,0.10)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SliderPreset: preset pills + "Other" reveals slider ─────────────────────

export function SliderPreset({
  presets, sliderProps, value, onChange, onBlur, valid,
}: {
  presets: { label: string; value: string }[];
  sliderProps: Omit<SliderInputProps, "value" | "onChange" | "onBlur" | "valid">;
  value: string; onChange: (v: string) => void; onBlur?: () => void; valid?: boolean;
}) {
  const isPreset = presets.some((p) => p.value === value);
  const [showSlider, setShowSlider] = useState(!isPreset && value.length > 0);

  function selectPreset(v: string) {
    setShowSlider(false);
    onChange(v);
    onBlur?.();
  }

  function openSlider() {
    setShowSlider(true);
    onChange("");
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {presets.map((p) => {
          const active = value === p.value && !showSlider;
          return (
            <button
              key={p.value} type="button" onClick={() => selectPreset(p.value)}
              style={chipStyle(active)}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button" onClick={openSlider}
          style={chipStyle(showSlider)}
        >
          Other
        </button>
      </div>
      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <SliderInput
              {...sliderProps}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              valid={valid}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RadioPills({ name, form, options, error }: {
  name: string; form: AnyForm;
  options: { value: string; label: string }[]; error?: string;
}) {
  const { field } = useController({ name, control: form.control });
  return (
    <div>
      <div style={{ minHeight: 44, display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {options.map((opt) => {
          const active = field.value === opt.value;
          return (
            <button
              key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
              style={chipStyle(active)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "5px", fontSize: "12px", color: "#dc2626", fontFamily: "var(--font-af)" }} role="alert">⚠ {error}</motion.p>}
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
      {label && (
        <span style={{
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "#b0b5b0", fontFamily: "var(--font-af)", whiteSpace: "nowrap",
        }}>{label}</span>
      )}
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
    </div>
  );
}

// ─── Segmented progress bar ───────────────────────────────────────────────────

export function SegmentedProgress({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "3px", marginBottom: "32px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: "3px", borderRadius: "99px", background: "rgba(0,0,0,0.10)", overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", borderRadius: "99px", background: i < step ? "var(--color-hudson-blue)" : i === step ? "var(--color-ink)" : "transparent", transformOrigin: "left" }}
            initial={false}
            animate={{ scaleX: i <= step ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: i <= step ? i * 0.04 : 0 }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Step fields with entrance stagger ───────────────────────────────────────

export function StaggeredFields({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut", delay: i * 0.06 }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}

// ─── Step components ───────────────────────────────────────────────────────────

export const SECTOR_CHIPS = ["SaaS", "FinTech", "HealthTech", "EdTech", "AI / ML", "DevTools", "Marketplace", "Consumer", "CleanTech", "PropTech"];
export const METRIC_CHIPS = ["ARR", "MRR", "NRR", "Churn", "Customers", "DAUs", "CAC", "LTV", "GMV", "Gross margin"];
export const FUNDS_CHIPS = ["Engineering", "Sales", "Marketing", "Operations", "Hiring", "R&D", "Infrastructure", "Working capital"];
export const ROLE_CHIPS = ["CEO & Co-Founder", "CTO & Co-Founder", "COO", "Head of Product", "Advisor"];

export const BIO_MAX = 300;

export function dicebearUrl(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=dbeafe,e0e7ff,dcfce7,fef9c3&backgroundType=solid&fontSize=38&fontWeight=600`;
}

export function TeamAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const hasName = name.trim().length > 0;
  if (hasName) {
    return (
      <img
        src={dicebearUrl(name)}
        alt={name}
        width={size} height={size}
        style={{ borderRadius: "50%", flexShrink: 0, border: "1.5px solid rgba(0,129,192,0.18)", display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "rgba(0,0,0,0.05)", border: "1.5px dashed #c4c9c4",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0b5b0" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
}

export function TeamMemberRow({ index, form, onRemove, expanded, onToggle, showRemove, teamErrors, fieldName = "teamMembers" }: {
  index: number; form: AnyForm; onRemove: () => void; fieldName?: string;
  expanded: boolean; onToggle: () => void; showRemove: boolean;
  teamErrors: { [k: number]: { name?: { message?: string }; role?: { message?: string }; bio?: { message?: string } } } | undefined;
}) {
  const { register } = form;
  const name = (useWatch({ control: form.control, name: `${fieldName}.${index}.name` }) as string) || "";
  const role = (useWatch({ control: form.control, name: `${fieldName}.${index}.role` }) as string) || "";
  const bio  = (useWatch({ control: form.control, name: `${fieldName}.${index}.bio`  }) as string) || "";
  const hasName = name.trim().length > 0;
  const nameId = `${fieldName}-${index}-name`;
  const roleId = `${fieldName}-${index}-role`;
  const bioId  = `${fieldName}-${index}-bio`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        border: "1px solid #b8bdb8", borderRadius: "10px",
        background: "rgba(255,255,255,0.88)", overflow: "hidden",
      }}
    >
      {/* Card header — always visible */}
      <button
        type="button" onClick={onToggle} aria-expanded={expanded}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 14px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left", minHeight: "60px",
        }}
      >
        <TeamAvatar name={name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasName ? (
            <>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-ink)", fontFamily: "var(--font-af)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </div>
              {role && (
                <div style={{ fontSize: "12px", color: "#5a5f5a", fontFamily: "var(--font-af)", marginTop: "1px" }}>{role}</div>
              )}
            </>
          ) : (
            <span style={{ fontSize: "14px", color: "#b0b5b0", fontFamily: "var(--font-af)" }}>
              Member {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {showRemove && (
            <span
              role="button" tabIndex={0} title="Remove member"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onRemove(); } }}
              style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4c9c4", cursor: "pointer", transition: "color 150ms, background 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.background = "rgba(220,38,38,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#c4c9c4"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </span>
          )}
          <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a5f5a", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms cubic-bezier(0.4,0,0.2,1)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expandable fields */}
      <div style={{ display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr", transition: "grid-template-rows 220ms cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 14px 16px", borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Name + Role side by side (stacked on small screens) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Name" htmlFor={nameId} required error={teamErrors?.[index]?.name?.message}>
                <StyledInput {...register(`${fieldName}.${index}.name`)} id={nameId} placeholder="Jane Smith" autoComplete="name" />
              </Field>
              <Field label="Role / title" htmlFor={roleId} required error={teamErrors?.[index]?.role?.message}>
                <StyledInput {...register(`${fieldName}.${index}.role`)} id={roleId} placeholder="CEO & Co-Founder" autoComplete="organization-title" />
                {!role.trim() && (
                  <QuickChips
                    chips={ROLE_CHIPS}
                    onSelect={(c) => form.setValue(`${fieldName}.${index}.role`, c, { shouldValidate: true, shouldTouch: true })}
                  />
                )}
              </Field>
            </div>

            {/* Bio with char count */}
            <Field label="Background" htmlFor={bioId} required error={teamErrors?.[index]?.bio?.message}
              why="Investors back people as much as products. Relevant domain expertise and past wins establish credibility."
            >
              <div style={{ position: "relative" }}>
                <StyledTextarea
                  {...register(`${fieldName}.${index}.bio`)}
                  id={bioId}
                  rows={2}
                  maxLength={BIO_MAX}
                  placeholder="Prior wins, relevant experience, why they're the one…"
                  valid={!teamErrors?.[index]?.bio && bio.length >= 10}
                />
                <div style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "10px", color: bio.length < 10 ? (bio.length === 0 ? "#b0b5b0" : "#b45309") : bio.length > BIO_MAX * 0.85 ? (bio.length >= BIO_MAX ? "#dc2626" : "#f59e0b") : "#b0b5b0", fontFamily: "var(--font-af)", pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}>
                  {bio.length < 10 ? `${bio.length} / min 10` : `${bio.length}/${BIO_MAX}`}
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


export function ProjectionRows({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { years: parsedYears, note } = parseProjections(value);
  const [y1, y2, y3] = parsedYears;

  const serialize = (a: string, b: string, c: string, n: string) =>
    serializeProjections([a, b, c], n);

  const years = [
    { label: "Year 1", val: y1, placeholder: "3,000,000", key: 0 },
    { label: "Year 2", val: y2, placeholder: "8,000,000", key: 1 },
    { label: "Year 3", val: y3, placeholder: "20,000,000", key: 2 },
  ];

  const vals = [y1, y2, y3];
  const setVal = (idx: number, v: string) => {
    const next = [...vals];
    next[idx] = v;
    onChange(serialize(next[0], next[1], next[2], note));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", borderRadius: "8px", overflow: "hidden", border: "1px solid #b8bdb8" }}>
      {years.map(({ label, val, placeholder, key }, idx) => (
        <ProjectionRow
          key={key}
          year={label}
          value={val}
          placeholder={placeholder}
          isLast={idx === years.length - 1 && !false}
          onChange={v => setVal(idx, v)}
        />
      ))}
      {/* Key assumption row */}
      <div style={{
        display: "flex", alignItems: "center",
        borderTop: "1px solid #e0e4e0",
        background: "rgba(248,249,248,0.7)",
      }}>
        <span style={{
          padding: "10px 14px", fontSize: "12px", color: "#5a5f5a",
          fontFamily: "var(--font-af)", whiteSpace: "nowrap", borderRight: "1px solid #e0e4e0",
          minWidth: "90px",
        }}>Assumption</span>
        <input
          type="text"
          value={note}
          placeholder="Key growth driver (optional)"
          onChange={e => onChange(serialize(y1, y2, y3, e.target.value))}
          style={{
            flex: 1, padding: "10px 14px", fontSize: "16px",
            fontFamily: "var(--font-af)", color: "var(--color-ink)",
            background: "transparent", border: "none", outline: "none",
          }}
        />
      </div>
    </div>
  );
}

export function ProjectionRow({ year, value, placeholder, onChange, isLast }: {
  year: string; value: string; placeholder: string;
  onChange: (v: string) => void; isLast: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasVal = value.trim().length > 0;
  const digits = normalizeMoney(value);
  const echo = digits && parseInt(digits, 10) >= 1000 ? abbreviateMoney(digits) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const plain = raw.replace(/,/g, "");
    // Same live-grouping rule as MoneyField: regroup while appending, leave
    // mid-string edits alone so the cursor stays put; blur cleans up.
    if (onlyDigits(plain) && e.target.selectionStart === raw.length) {
      onChange(formatThousands(plain));
    } else {
      onChange(raw);
    }
  }

  function handleBlur() {
    setFocused(false);
    const normalized = normalizeMoney(value);
    if (normalized && value.trim() !== formatThousands(normalized)) {
      onChange(formatThousands(normalized));
    }
  }
  return (
    <div style={{
      display: "flex", alignItems: "center",
      borderBottom: isLast ? "none" : "1px solid #e0e4e0",
      background: focused ? "rgba(0,129,192,0.025)" : "rgba(255,255,255,0.8)",
      transition: "background 150ms",
    }}>
      {/* Year badge */}
      <span style={{
        padding: "12px 14px", fontSize: "12px", fontWeight: 500,
        color: hasVal ? "var(--color-hudson-blue)" : "#5a5f5a",
        fontFamily: "var(--font-af)", whiteSpace: "nowrap",
        borderRight: "1px solid #e0e4e0", minWidth: "60px",
        transition: "color 200ms",
      }}>{year}</span>

      {/* $ prefix */}
      <span style={{ padding: "0 4px 0 12px", color: "var(--color-iron)", fontSize: "14px", fontFamily: "var(--font-af)" }}>$</span>

      {/* Amount input */}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        style={{
          flex: 1, padding: "12px 12px 12px 2px", fontSize: "16px",
          fontFamily: "var(--font-af)", color: "var(--color-ink)",
          background: "transparent", border: "none", outline: "none",
        }}
      />

      {/* Abbreviated echo + validated indicator */}
      {echo && (
        <span style={{ fontSize: "11px", color: "#8a908a", fontFamily: "var(--font-af)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
          = {echo}
        </span>
      )}
      <div style={{ padding: "0 12px", opacity: hasVal ? 1 : 0, transition: "opacity 200ms" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.5" fill="#22c55e" />
          <path d="M4.5 7l2 2L9.5 5.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}


export function MoneyField({ form, name, id, placeholder, suffix, chips }: {
  form: AnyForm; name: string; id: string; placeholder: string;
  suffix?: string; chips?: { label: string; value: string }[];
}) {
  const { field, fieldState } = useController({ name, control: form.control });
  const stored = typeof field.value === "string" ? field.value : "";
  const [text, setText] = useState(() => (onlyDigits(stored) ? formatThousands(stored) : stored));
  const dirtyRef = useRef(false);

  function applyValue(v: string) {
    field.onChange(v);
    setText(onlyDigits(v) ? formatThousands(v) : v);
    dirtyRef.current = false;
    field.onBlur();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    dirtyRef.current = true;
    const raw = e.target.value;
    const plain = raw.replace(/,/g, "");
    if (onlyDigits(plain)) {
      // Regroup commas live only when typing at the end — mid-string edits
      // keep the raw text so the cursor doesn't jump; blur cleans up.
      const atEnd = e.target.selectionStart === raw.length;
      setText(atEnd ? formatThousands(plain) : raw);
      field.onChange(plain);
    } else {
      setText(raw);
      field.onChange(normalizeMoney(raw) || raw);
    }
  }

  function handleBlur() {
    if (dirtyRef.current) {
      const normalized = normalizeMoney(text);
      if (normalized) {
        field.onChange(normalized);
        setText(formatThousands(normalized));
      }
    }
    field.onBlur();
  }

  const digits = onlyDigits(stored) ? stored : "";
  const echo = digits && parseInt(digits, 10) >= 1000 ? abbreviateMoney(digits) : "";
  const valid = fieldState.isTouched && !fieldState.invalid && stored.length > 0;

  return (
    <div>
      <InputAdornment prefix="$" suffix={suffix}>
        <StyledInput
          id={id}
          name={field.name}
          ref={field.ref}
          value={text}
          placeholder={placeholder}
          inputMode="decimal"
          autoComplete="off"
          valid={valid}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ paddingLeft: "24px", ...(suffix ? { paddingRight: "44px" } : {}) }}
        />
      </InputAdornment>
      <div style={{ height: "16px", marginTop: "3px", textAlign: "right" }}>
        {echo && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
            style={{ fontSize: "11px", color: "#5a5f5a", fontFamily: "var(--font-af)", fontVariantNumeric: "tabular-nums" }}
          >= {echo}</motion.span>
        )}
      </div>
      {chips && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "2px" }}>
          {chips.map(({ label, value }) => {
            const active = stored === value;
            return (
              <button key={label} type="button" onClick={() => applyValue(value)}
                style={{
                  padding: "4px 10px", borderRadius: "50px", fontSize: "11px",
                  fontFamily: "var(--font-af)", fontWeight: active ? 600 : 500, cursor: "pointer", transition: "all 140ms",
                  color: active ? "var(--color-hudson-blue)" : "var(--color-iron)",
                  border: active ? "1.5px solid var(--color-hudson-blue)" : "1px solid #c4c9c4",
                  background: active ? "rgba(0,129,192,0.08)" : "transparent",
                }}
                onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "var(--color-hudson-blue)"; el.style.color = "var(--color-hudson-blue)"; el.style.background = "rgba(0,129,192,0.05)"; } }}
                onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#c4c9c4"; el.style.color = "var(--color-iron)"; el.style.background = "transparent"; } }}
              >{label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Allocation builder ───────────────────────────────────────────────────────

export function AllocationBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [rows, setRows] = useState<AllocRow[]>(() => {
    const parsed = parseAllocations(value);
    return parsed.length ? parsed : [{ category: "", pct: "" }];
  });

  const total = rows.reduce((sum, r) => sum + (parseInt(r.pct) || 0), 0);
  const totalOk = total === 100;
  const totalOver = total > 100;

  function update(next: AllocRow[]) {
    setRows(next);
    onChange(serializeAllocations(next));
  }

  function addRow(category = "") {
    // Fill an existing empty row before appending a new one, then put the
    // cursor in that row's % field so the next keystroke is the number.
    const next = [...rows];
    const emptyIdx = next.findIndex(r => !r.category.trim() && !r.pct);
    const target = category && emptyIdx !== -1 ? emptyIdx : next.length;
    if (target === next.length) next.push({ category, pct: "" });
    else next[target] = { ...next[target], category };
    update(next);
    setTimeout(() => document.getElementById(`alloc-pct-${target}`)?.focus(), 30);
  }

  function removeRow(i: number) {
    update(rows.filter((_, idx) => idx !== i));
  }

  function setCategory(i: number, v: string) {
    const next = [...rows]; next[i] = { ...next[i], category: v }; update(next);
  }

  function setPct(i: number, v: string) {
    const next = [...rows]; next[i] = { ...next[i], pct: v }; update(next);
  }

  // One tap instead of mental math: pour whatever is left of the 100% into
  // the last row.
  function balanceToHundred() {
    const last = rows.length - 1;
    const sumOthers = rows.reduce((s, r, i) => (i === last ? s : s + (parseInt(r.pct) || 0)), 0);
    const remainder = 100 - sumOthers;
    if (remainder <= 0) return;
    const next = [...rows];
    next[last] = { ...next[last], pct: String(remainder) };
    update(next);
  }

  return (
    <div>
      <div style={{ border: "1px solid #b8bdb8", borderRadius: "8px", overflow: "hidden" }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center",
            borderBottom: i < rows.length - 1 ? "1px solid #eaece9" : "none",
            background: "rgba(255,255,255,0.85)",
          }}>
            <input
              type="text"
              value={row.category}
              placeholder={FUNDS_CHIPS[i] ? `e.g. ${FUNDS_CHIPS[i]}` : "Category"}
              onChange={e => setCategory(i, e.target.value)}
              style={{ flex: 1, padding: "11px 14px", fontSize: "16px", fontFamily: "var(--font-af)", color: "var(--color-ink)", background: "transparent", border: "none", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 12px", borderLeft: "1px solid #eaece9", flexShrink: 0 }}>
              <input
                id={`alloc-pct-${i}`}
                type="text"
                inputMode="numeric"
                value={row.pct}
                placeholder="0"
                aria-label={`${row.category || `Category ${i + 1}`} percentage`}
                onChange={e => setPct(i, e.target.value.replace(/[^0-9]/g, ""))}
                style={{ width: "44px", fontSize: "16px", fontFamily: "var(--font-af)", color: "var(--color-ink)", background: "transparent", border: "none", outline: "none", textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              />
              <span style={{ fontSize: "13px", color: "#5a5f5a", fontFamily: "var(--font-af)" }}>%</span>
            </div>
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(i)}
                style={{ padding: "0 10px", height: "100%", background: "transparent", border: "none", borderLeft: "1px solid #eaece9", cursor: "pointer", color: "#c4c9c4", transition: "color 140ms", fontSize: "14px", display: "flex", alignItems: "center" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#c4c9c4"; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Total row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 14px", background: "rgba(0,0,0,0.025)", borderTop: "1px solid #eaece9" }}>
          <span style={{ fontSize: "11px", color: "#5a5f5a", fontFamily: "var(--font-af)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total</span>
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {total < 100 && rows.some(r => r.category.trim()) && (
              <button
                type="button" onClick={balanceToHundred}
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontSize: "11px", fontWeight: 500, fontFamily: "var(--font-af)",
                  color: "var(--color-hudson-blue)", textDecoration: "underline", textUnderlineOffset: "2px",
                }}
              >
                Balance to 100%
              </button>
            )}
            <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-af)", fontVariantNumeric: "tabular-nums", color: totalOk ? "#22c55e" : totalOver ? "#dc2626" : "var(--color-ink)", transition: "color 200ms" }}>
              {total}%{totalOk && " ✓"}
            </span>
          </span>
        </div>
      </div>

      {/* Add row + quick chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px", alignItems: "center" }}>
        {FUNDS_CHIPS.filter(c => !rows.some(r => r.category.toLowerCase() === c.toLowerCase())).map(chip => (
          <button key={chip} type="button" onClick={() => addRow(chip)}
            style={{ padding: "4px 10px", borderRadius: "50px", fontSize: "11px", fontFamily: "var(--font-af)", fontWeight: 500, color: "var(--color-iron)", border: "1px solid #c4c9c4", background: "transparent", cursor: "pointer", transition: "all 140ms" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "var(--color-hudson-blue)"; el.style.color = "var(--color-hudson-blue)"; el.style.background = "rgba(0,129,192,0.05)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#c4c9c4"; el.style.color = "var(--color-iron)"; el.style.background = "transparent"; }}
          >+ {chip}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Tag input for investors ──────────────────────────────────────────────────

export function TagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState("");
  const tags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag].join(", "));
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag).join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 10px", border: "1px solid #b8bdb8", borderRadius: "6px", background: "rgba(255,255,255,0.92)", minHeight: "44px", alignItems: "center", cursor: "text" }}
      onClick={() => document.getElementById("investor-tag-input")?.focus()}
    >
      {tags.map(tag => (
        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px 3px 10px", borderRadius: "50px", background: "rgba(0,129,192,0.08)", border: "1px solid rgba(0,129,192,0.2)", fontSize: "12px", fontFamily: "var(--font-af)", color: "var(--color-hudson-blue)", fontWeight: 500 }}>
          {tag}
          <button type="button" onClick={() => removeTag(tag)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(0,129,192,0.5)", lineHeight: 1, display: "flex", alignItems: "center" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,129,192,0.5)"; }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </span>
      ))}
      <input
        id="investor-tag-input"
        type="text"
        value={input}
        placeholder={tags.length ? "" : "YC W23, Sequoia seed… Enter to add"}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        style={{ flex: 1, minWidth: "120px", fontSize: "16px", fontFamily: "var(--font-af)", color: "var(--color-ink)", background: "transparent", border: "none", outline: "none", padding: "2px 4px" }}
      />
    </div>
  );
}

