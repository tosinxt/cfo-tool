"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Cloudscape from "@/components/forgeui/cloudscape";
import { AnimatedCheckmarkCircle } from "@/components/forgeui/animated-form";
import {
  useForm,
  useFieldArray,
  useWatch,
  useController,
  type UseFormReturn,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  type AllStepData,
} from "./schemas";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "Company",
  "Problem & Market",
  "Traction",
  "Team",
  "Financials",
  "The Raise",
] as const;

const STEP_TIME = ["~2 min", "~3 min", "~2 min", "~4 min", "~3 min", "~2 min"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stepSchemas: any[] = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema];

const STAGE_OPTIONS = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b+", label: "Series B+" },
];

interface Props { engagementId: string; token: string; }
type FormInstance = UseFormReturn<AllStepData>;
const STORAGE_KEY = (id: string) => `intake_draft_${id}`;

// ─── Animated checkmark ───────────────────────────────────────────────────────

const CIRCLE_LEN = 2 * Math.PI * 7; // r=7 matches AnimatedCheckmarkCircle

function FieldCheck({ show }: { show: boolean }) {
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

function WhyHint({ text }: { text: string }) {
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

function Field({
  label, hint, error, htmlFor, children, required, why,
}: {
  label: string; hint?: string; error?: string; htmlFor?: string;
  children: React.ReactNode; required?: boolean; why?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <label
          htmlFor={htmlFor}
          className="text-[13px]"
          style={{ color: "var(--color-iron)", fontFamily: "var(--font-af)", fontWeight: 500, letterSpacing: "0.01em" }}
        >
          {label}
          {required && <span style={{ color: "#dc2626", marginLeft: "3px", fontWeight: 400 }}>*</span>}
        </label>
        {why && <WhyHint text={why} />}
      </div>
      {hint && (
        <p className="text-[12px]" style={{ color: "#5a5f5a", fontFamily: "var(--font-af)", lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-[12px]" style={{ color: "#dc2626" }} role="alert"
        >
          ⚠ {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Input adornment wrapper ──────────────────────────────────────────────────

function InputGroupWithSuffix({ suffix, children }: { suffix: string; children: React.ReactNode }) {
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

function SliderInput({ value, onChange, onBlur, min, max, step = 1, unit, ticks, id, placeholder, valid }: SliderInputProps) {
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

function InputAdornment({ prefix, suffix, children }: { prefix?: string; suffix?: string; children: React.ReactNode }) {
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

const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { valid?: boolean }>(
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

const StyledTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { valid?: boolean }>(
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

const StyledSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
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

function CharRing({ current, max }: { current: number; max: number }) {
  const r = 8; const circ = 2 * Math.PI * r;
  const pct = Math.min(1, current / max);
  const over = current > max;
  const color = over ? "#dc2626" : pct > 0.85 ? "#f59e0b" : "var(--color-hudson-blue)";
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
      <span style={{ fontSize: "11px", fontFamily: "var(--font-af)", color: over ? "#dc2626" : "#5a5f5a", fontVariantNumeric: "tabular-nums" }}>
        {current}/{max}
      </span>
    </div>
  );
}

/** Textarea with live character count ring */
const CharTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { maxLength: number; currentLength: number; valid?: boolean }
>(function CharTextarea({ maxLength, currentLength, valid, ...props }, ref) {
  return (
    <div>
      <StyledTextarea {...props} ref={ref} valid={valid} />
      <CharRing current={currentLength} max={maxLength} />
    </div>
  );
});

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function QuickChips({ chips, onSelect }: { chips: string[]; onSelect: (chip: string) => void }) {
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

// ─── PillSelect: chip grid + "Other" reveals text input ──────────────────────

function PillSelect({
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
              style={{
                padding: "8px 14px", borderRadius: "50px", fontSize: "13px",
                fontFamily: "var(--font-af)", cursor: "pointer",
                transition: "all 150ms",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-hudson-blue)" : "var(--color-steel)",
                border: active ? "1.5px solid var(--color-hudson-blue)" : "1px solid #b0b5b0",
                background: active ? "rgba(0,129,192,0.08)" : "transparent",
                minHeight: "36px",
              }}
            >
              {chip}
            </button>
          );
        })}
        <button
          type="button" onClick={openOther}
          style={{
            padding: "8px 14px", borderRadius: "50px", fontSize: "13px",
            fontFamily: "var(--font-af)", cursor: "pointer",
            transition: "all 150ms",
            fontWeight: showOther ? 600 : 400,
            color: showOther ? "var(--color-hudson-blue)" : "var(--color-steel)",
            border: showOther ? "1.5px solid var(--color-hudson-blue)" : "1px solid #b0b5b0",
            background: showOther ? "rgba(0,129,192,0.08)" : "transparent",
            minHeight: "36px",
          }}
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

function SliderPreset({
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
              style={{
                padding: "8px 14px", borderRadius: "50px", fontSize: "13px",
                fontFamily: "var(--font-af)", cursor: "pointer",
                transition: "all 150ms",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-hudson-blue)" : "var(--color-steel)",
                border: active ? "1.5px solid var(--color-hudson-blue)" : "1px solid #b0b5b0",
                background: active ? "rgba(0,129,192,0.08)" : "transparent",
                minHeight: "36px",
              }}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button" onClick={openSlider}
          style={{
            padding: "8px 14px", borderRadius: "50px", fontSize: "13px",
            fontFamily: "var(--font-af)", cursor: "pointer",
            transition: "all 150ms",
            fontWeight: showSlider ? 600 : 400,
            color: showSlider ? "var(--color-hudson-blue)" : "var(--color-steel)",
            border: showSlider ? "1.5px solid var(--color-hudson-blue)" : "1px solid #b0b5b0",
            background: showSlider ? "rgba(0,129,192,0.08)" : "transparent",
            minHeight: "36px",
          }}
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

function RadioPills({ name, form, options, error }: {
  name: keyof AllStepData; form: FormInstance;
  options: { value: string; label: string }[]; error?: string;
}) {
  const { field } = useController({ name, control: form.control });
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => {
          const active = field.value === opt.value;
          return (
            <button
              key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
              style={{
                padding: "10px 20px", borderRadius: "50px", fontSize: "14px",
                fontFamily: "var(--font-af)", fontWeight: active ? 500 : 400,
                border: `1px solid ${active ? "var(--color-ink)" : "#c0c5c0"}`,
                background: active ? "var(--color-ink)" : "transparent",
                color: active ? "white" : "var(--color-steel)", cursor: "pointer",
                transition: "all 180ms ease", minHeight: "44px",
              }}
              onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "var(--color-iron)"; el.style.color = "var(--color-ink)"; } }}
              onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#c0c5c0"; el.style.color = "var(--color-iron)"; } }}
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

function Divider({ label }: { label?: string }) {
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

function SegmentedProgress({ step, total }: { step: number; total: number }) {
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

function StaggeredFields({ children }: { children: React.ReactNode }) {
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

const SECTOR_CHIPS = ["SaaS", "FinTech", "HealthTech", "EdTech", "AI / ML", "DevTools", "Marketplace", "Consumer", "CleanTech", "PropTech"];
const METRIC_CHIPS = ["ARR", "MRR", "NRR", "Churn", "Customers", "DAUs", "CAC", "LTV", "GMV", "Gross margin"];
const FUNDS_CHIPS = ["Engineering", "Sales", "Marketing", "Operations", "Hiring", "R&D", "Infrastructure", "Working capital"];

function Step1({ form, stageOptions }: { form: FormInstance; stageOptions: { value: string; label: string }[] }) {
  const { register, setValue, formState: { errors, touchedFields } } = form;
  const oneLiner = (useWatch({ control: form.control, name: "oneLiner" }) as string) || "";
  const companyName = (useWatch({ control: form.control, name: "companyName" }) as string) || "";
  const sector = (useWatch({ control: form.control, name: "sector" }) as string) || "";

  return (
    <StaggeredFields>
      <Field label="Company name" htmlFor="companyName" error={errors.companyName?.message} required>
        <StyledInput
          {...register("companyName")}
          id="companyName"
          placeholder="Acme Inc."
          autoComplete="organization"
          valid={touchedFields.companyName && !errors.companyName && companyName.length > 0}
          style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "-0.2px" }}
        />
      </Field>

      <Field
        label="One-liner" htmlFor="oneLiner" required
        hint="The single sentence that makes an investor lean in."
        error={errors.oneLiner?.message}
        why="Investors read hundreds of decks. Your one-liner is the hook — it sets the frame for everything that follows."
      >
        <CharTextarea
          {...register("oneLiner")}
          id="oneLiner" rows={2} maxLength={160} currentLength={oneLiner.length}
          placeholder="We help [who] do [what] without [pain]"
          valid={touchedFields.oneLiner && !errors.oneLiner && oneLiner.length > 10}
        />
      </Field>

      <Field label="Sector" htmlFor="sector" error={errors.sector?.message} required>
        <PillSelect
          id="sector"
          chips={SECTOR_CHIPS}
          value={sector}
          onChange={(v) => setValue("sector", v, { shouldValidate: true, shouldTouch: true })}
          placeholder="e.g. AgriTech, LegalTech…"
          valid={touchedFields.sector && !errors.sector && sector.length > 0}
        />
      </Field>

      <Field label="Current stage" error={errors.stage?.message} required>
        <RadioPills name="stage" form={form} options={stageOptions} error={errors.stage?.message} />
      </Field>
    </StaggeredFields>
  );
}

function Step2({ form }: { form: FormInstance }) {
  const { register, formState: { errors, touchedFields } } = form;
  const problem = (useWatch({ control: form.control, name: "problem" }) as string) || "";
  const solution = (useWatch({ control: form.control, name: "solution" }) as string) || "";
  const marketSize = (useWatch({ control: form.control, name: "marketSize" }) as string) || "";

  return (
    <StaggeredFields>
      <Field
        label="The problem" htmlFor="problem" required
        hint="What specific pain are you solving, and who feels it most?"
        error={errors.problem?.message}
        why="Investors fund solutions to real pain. The clearer the problem, the more credible the opportunity."
      >
        <CharTextarea
          {...register("problem")}
          id="problem" rows={4} maxLength={600} currentLength={problem.length}
          placeholder="What's broken, how often, and who feels it most?"
          valid={touchedFields.problem && !errors.problem && problem.length > 30}
        />
      </Field>

      <Divider label="then" />

      <Field
        label="Your solution" htmlFor="solution" required
        hint="How does your product solve it in a way no one else does?"
        error={errors.solution?.message}
        why="The solution section answers 'why you, why now' — it's where differentiation gets established."
      >
        <CharTextarea
          {...register("solution")}
          id="solution" rows={4} maxLength={600} currentLength={solution.length}
          placeholder="Your approach, the key insight, why it works now"
          valid={touchedFields.solution && !errors.solution && solution.length > 30}
        />
      </Field>

      <Field
        label="Market size" htmlFor="marketSize" required
        hint="TAM → SAM → SOM. Investors want to see how you think about scope."
        error={errors.marketSize?.message}
        why="Market size frames the ceiling of the opportunity. Too small = not fundable. Too vague = not credible."
      >
        <CharTextarea
          {...register("marketSize")}
          id="marketSize" rows={3} maxLength={400} currentLength={marketSize.length}
          placeholder="$50B TAM (total market) · $8B SAM (serviceable) · $400M SOM (obtainable)"
          valid={touchedFields.marketSize && !errors.marketSize && marketSize.length > 0}
        />
        <QuickChips
          chips={["TAM: ", "SAM: ", "SOM: "]}
          onSelect={(chip) => {
            const current = marketSize.trim();
            form.setValue("marketSize", current ? `${current}  ${chip}` : chip, { shouldValidate: false });
          }}
        />
      </Field>
    </StaggeredFields>
  );
}

function Step3({ form }: { form: FormInstance }) {
  const { register, setValue, formState: { errors, touchedFields } } = form;
  const keyMetrics = (useWatch({ control: form.control, name: "keyMetrics" }) as string) || "";
  const growthRate = (useWatch({ control: form.control, name: "growthRate" }) as string) || "";

  function appendMetric(chip: string) {
    const current = keyMetrics.trim();
    setValue("keyMetrics", current ? `${current}, ${chip}: ` : `${chip}: `, { shouldValidate: false });
  }

  return (
    <StaggeredFields>
      <Field
        label="Key metrics" htmlFor="keyMetrics" required
        hint="The numbers that tell your growth story."
        error={errors.keyMetrics?.message}
        why="Metrics are the proof behind the narrative. Investors pattern-match against benchmarks — give them something to anchor."
      >
        <CharTextarea
          {...register("keyMetrics")}
          id="keyMetrics" rows={4} maxLength={500} currentLength={keyMetrics.length}
          placeholder="$1.2M ARR · 500 customers · 92% NRR · 15% MoM"
          valid={touchedFields.keyMetrics && !errors.keyMetrics && keyMetrics.length > 10}
        />
        <QuickChips chips={METRIC_CHIPS} onSelect={appendMetric} />
      </Field>

      <Field
        label="Growth rate" htmlFor="growthRate" required
        hint="MoM, QoQ, or YoY — whichever tells the best story."
        error={errors.growthRate?.message}
      >
        <SliderPreset
          presets={[
            { label: "5%", value: "5" },
            { label: "15%", value: "15" },
            { label: "30%", value: "30" },
            { label: "50%", value: "50" },
            { label: "100%", value: "100" },
            { label: "200%+", value: "200" },
          ]}
          sliderProps={{ id: "growthRate", min: 0, max: 500, step: 5, unit: "%", ticks: [0, 50, 100, 200, 300, 500], placeholder: "15" }}
          value={growthRate}
          onChange={v => form.setValue("growthRate", v, { shouldValidate: true, shouldTouch: true })}
          onBlur={() => form.trigger("growthRate")}
          valid={touchedFields.growthRate && !errors.growthRate && growthRate.length > 0}
        />
        {/* Benchmark band */}
        {(() => {
          const n = parseFloat(growthRate);
          if (isNaN(n) || growthRate === "") return null;
          const label = n >= 200 ? { text: "Hypergrowth", color: "#7c3aed", bg: "rgba(124,58,237,0.07)", border: "rgba(124,58,237,0.2)" }
            : n >= 100 ? { text: "Top decile", color: "#0081c0", bg: "rgba(0,129,192,0.07)", border: "rgba(0,129,192,0.2)" }
            : n >= 20 ? { text: "Strong growth", color: "#22c55e", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.2)" }
            : n >= 5 ? { text: "Moderate growth", color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.2)" }
            : { text: "Below benchmark", color: "#5a5f5a", bg: "rgba(0,0,0,0.04)", border: "rgba(0,0,0,0.1)" };
          return (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "50px", fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-af)", color: label.color, background: label.bg, border: `1px solid ${label.border}`, transition: "all 200ms" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: label.color, flexShrink: 0 }} />
                {label.text}
              </span>
              <span style={{ fontSize: "11px", color: "#5a5f5a", fontFamily: "var(--font-af)" }}>Series A benchmark: 15–30% MoM</span>
            </div>
          );
        })()}
      </Field>

      <Field
        label="Notable customers" htmlFor="notableCustomers"
        hint="Optional — brand names that signal market trust."
        error={errors.notableCustomers?.message}
      >
        <StyledInput {...register("notableCustomers")} id="notableCustomers" placeholder="Goldman Sachs, Mayo Clinic, Shopify…" />
      </Field>
    </StaggeredFields>
  );
}

// ─── Team member card ─────────────────────────────────────────────────────────

const BIO_MAX = 300;

function dicebearUrl(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=dbeafe,e0e7ff,dcfce7,fef9c3&backgroundType=solid&fontSize=38&fontWeight=600`;
}

function TeamAvatar({ name, size = 36 }: { name: string; size?: number }) {
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

function TeamMemberRow({ index, form, onRemove, expanded, onToggle, showRemove, teamErrors }: {
  index: number; form: FormInstance; onRemove: () => void;
  expanded: boolean; onToggle: () => void; showRemove: boolean;
  teamErrors: { [k: number]: { name?: { message?: string }; role?: { message?: string }; bio?: { message?: string } } } | undefined;
}) {
  const { register } = form;
  const name = (useWatch({ control: form.control, name: `teamMembers.${index}.name` }) as string) || "";
  const role = (useWatch({ control: form.control, name: `teamMembers.${index}.role` }) as string) || "";
  const bio  = (useWatch({ control: form.control, name: `teamMembers.${index}.bio`  }) as string) || "";
  const hasName = name.trim().length > 0;
  const nameId = `teamMembers-${index}-name`;
  const roleId = `teamMembers-${index}-role`;
  const bioId  = `teamMembers-${index}-bio`;

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

            {/* Name + Role side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label="Name" htmlFor={nameId} required error={teamErrors?.[index]?.name?.message}>
                <StyledInput {...register(`teamMembers.${index}.name`)} id={nameId} placeholder="Jane Smith" autoComplete="name" />
              </Field>
              <Field label="Role / title" htmlFor={roleId} required error={teamErrors?.[index]?.role?.message}>
                <StyledInput {...register(`teamMembers.${index}.role`)} id={roleId} placeholder="CEO & Co-Founder" autoComplete="organization-title" />
              </Field>
            </div>

            {/* Bio with char count */}
            <Field label="Background" htmlFor={bioId} required error={teamErrors?.[index]?.bio?.message}
              why="Investors back people as much as products. Relevant domain expertise and past wins establish credibility."
            >
              <div style={{ position: "relative" }}>
                <StyledTextarea
                  {...register(`teamMembers.${index}.bio`)}
                  id={bioId}
                  rows={2}
                  maxLength={BIO_MAX}
                  placeholder="Prior wins, relevant experience, why they're the one…"
                  valid={!teamErrors?.[index]?.bio && bio.length >= 10}
                />
                <div style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "10px", color: bio.length > BIO_MAX * 0.85 ? (bio.length >= BIO_MAX ? "#dc2626" : "#f59e0b") : "#b0b5b0", fontFamily: "var(--font-af)", pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}>
                  {bio.length}/{BIO_MAX}
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Step4({ form, fields, append, remove }: { form: FormInstance; fields: FieldArrayWithId<AllStepData, "teamMembers">[]; append: UseFieldArrayAppend<AllStepData, "teamMembers">; remove: UseFieldArrayRemove }) {
  const { formState: { errors } } = form;
  // Multiple cards can be open simultaneously — Set tracks expanded indices
  const [expandedSet, setExpandedSet] = useState<Set<number>>(() => new Set([0]));
  const teamErrors = errors.teamMembers as { [k: number]: { name?: { message?: string }; role?: { message?: string }; bio?: { message?: string } } } | undefined;

  function handleAppend() {
    append({ name: "", role: "", bio: "" });
    setExpandedSet(prev => new Set(Array.from(prev).concat(fields.length)));
  }

  function handleRemove(i: number) {
    remove(i);
    setExpandedSet(prev => {
      const next = new Set<number>();
      Array.from(prev).forEach(idx => {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
      });
      return next;
    });
  }

  function handleToggle(i: number) {
    setExpandedSet(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <StaggeredFields>
      <p className="text-[13px]" style={{ color: "#5a5f5a", fontFamily: "var(--font-af)", lineHeight: 1.6 }}>
        Add the people investors will evaluate — founder, co-founders, and key hires. Name, role, and a brief background per person.
      </p>
      <AnimatePresence initial={false}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {fields.map((field, i) => (
            <TeamMemberRow
              key={field.id} index={i} form={form}
              onRemove={() => handleRemove(i)}
              expanded={expandedSet.has(i)}
              onToggle={() => handleToggle(i)}
              showRemove={fields.length > 1}
              teamErrors={teamErrors}
            />
          ))}
        </div>
      </AnimatePresence>
      {fields.length < 6 && (
        <button type="button" onClick={handleAppend}
          className="w-full py-3 text-[13px] font-[500] transition-all"
          style={{ border: "1.5px dashed #c4c9c4", borderRadius: "10px", color: "#5a5f5a", background: "transparent", fontFamily: "var(--font-af)", minHeight: "44px", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-hudson-blue)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-hudson-blue)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,129,192,0.03)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#c4c9c4"; (e.currentTarget as HTMLButtonElement).style.color = "#5a5f5a"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add team member
          </span>
        </button>
      )}
      {typeof errors.teamMembers?.message === "string" && (
        <p className="text-[12px]" style={{ color: "#dc2626", fontFamily: "var(--font-af)" }}>{errors.teamMembers.message}</p>
      )}
    </StaggeredFields>
  );
}

// ─── 3-year projection rows ───────────────────────────────────────────────────

function ProjectionRows({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Parse stored string "Year 1: $X | Year 2: $Y | Year 3: $Z | Note: W" back into fields
  const parse = (s: string) => {
    const clean = (v: string) => v.replace(/^\$+/, "").trim();
    const y1 = clean(s.match(/Year 1:\s*\$?([^\|]*)/)?.[1] ?? "");
    const y2 = clean(s.match(/Year 2:\s*\$?([^\|]*)/)?.[1] ?? "");
    const y3 = clean(s.match(/Year 3:\s*\$?([^\|]*)/)?.[1] ?? "");
    const note = (s.match(/Note:\s*([^\|]+)/)?.[1] ?? "").trim();
    return [y1, y2, y3, note] as const;
  };
  const [y1, y2, y3, note] = parse(value);

  const serialize = (a: string, b: string, c: string, n: string) => {
    const parts = [`Year 1: $${a}`, `Year 2: $${b}`, `Year 3: $${c}`];
    if (n) parts.push(`Note: ${n}`);
    return parts.join(" | ");
  };

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

function ProjectionRow({ year, value, placeholder, onChange, isLast }: {
  year: string; value: string; placeholder: string;
  onChange: (v: string) => void; isLast: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasVal = value.trim().length > 0;
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
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, padding: "12px 12px 12px 2px", fontSize: "16px",
          fontFamily: "var(--font-af)", color: "var(--color-ink)",
          background: "transparent", border: "none", outline: "none",
        }}
      />

      {/* Validated indicator */}
      <div style={{ padding: "0 12px", opacity: hasVal ? 1 : 0, transition: "opacity 200ms" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6.5" fill="#22c55e" />
          <path d="M4.5 7l2 2L9.5 5.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function Step5({ form }: { form: FormInstance }) {
  const { register, formState: { errors, touchedFields } } = form;
  const projections = (useWatch({ control: form.control, name: "threeYearProjections" }) as string) || "";
  const currentRevenue = (useWatch({ control: form.control, name: "currentRevenue" }) as string) || "";
  const burnRate = (useWatch({ control: form.control, name: "burnRate" }) as string) || "";
  const runway = (useWatch({ control: form.control, name: "runway" }) as string) || "";

  return (
    <StaggeredFields>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current ARR / revenue" htmlFor="currentRevenue" error={errors.currentRevenue?.message} required
          why="Investors need a baseline to assess growth rate and funding efficiency."
        >
          <InputAdornment prefix="$">
            <StyledInput {...register("currentRevenue")} id="currentRevenue" placeholder="1,500,000" inputMode="decimal" autoComplete="off"
              valid={touchedFields.currentRevenue && !errors.currentRevenue && currentRevenue.length > 0}
              style={{ paddingLeft: "24px" }}
            />
          </InputAdornment>
        </Field>
        <Field label="Monthly burn" htmlFor="burnRate" error={errors.burnRate?.message} required
          why="Burn rate tells investors how much runway your raise buys and how capital-efficient you are."
        >
          <InputAdornment prefix="$" suffix="/mo">
            <StyledInput {...register("burnRate")} id="burnRate" placeholder="120,000" inputMode="decimal" autoComplete="off"
              valid={touchedFields.burnRate && !errors.burnRate && burnRate.length > 0}
              style={{ paddingLeft: "24px", paddingRight: "44px" }}
            />
          </InputAdornment>
        </Field>
      </div>

      <Field label="Runway" htmlFor="runway" required
        hint="How many months until you run out of cash at current burn?"
        error={errors.runway?.message}
      >
        <SliderPreset
          presets={[
            { label: "6 mo", value: "6" },
            { label: "12 mo", value: "12" },
            { label: "18 mo", value: "18" },
            { label: "24 mo", value: "24" },
            { label: "36 mo", value: "36" },
            { label: "48 mo", value: "48" },
          ]}
          sliderProps={{ id: "runway", min: 0, max: 48, step: 1, unit: "months", ticks: [0, 6, 12, 18, 24, 36, 48], placeholder: "14" }}
          value={runway}
          onChange={v => form.setValue("runway", v, { shouldValidate: true, shouldTouch: true })}
          onBlur={() => form.trigger("runway")}
          valid={touchedFields.runway && !errors.runway && runway.length > 0}
        />
      </Field>

      <Divider label="forward-looking" />

      <Field label="3-year ARR projections" required
        hint="Revenue targets by year — estimates are fine, show your ambition."
        error={errors.threeYearProjections?.message}
        why="Projections show ambition and financial fluency. They don't have to be precise — they need to be defensible."
      >
        <ProjectionRows
          value={projections}
          onChange={v => form.setValue("threeYearProjections", v, { shouldValidate: true, shouldTouch: true })}
        />
      </Field>
    </StaggeredFields>
  );
}

// ─── Amount quick-select chips ────────────────────────────────────────────────

function parseAmount(label: string): string {
  const s = label.replace(/^\$/, "").trim();
  if (/K$/i.test(s)) return String(parseFloat(s) * 1_000);
  if (/M$/i.test(s)) return String(parseFloat(s) * 1_000_000);
  if (/B$/i.test(s)) return String(parseFloat(s) * 1_000_000_000);
  return s.replace(/[^0-9.]/g, "");
}

function AmountChips({ amounts, currentValue, inputId, onSelect }: {
  amounts: string[]; currentValue?: string; inputId?: string; onSelect: (v: string) => void;
}) {
  const parsedAmounts = amounts.map(a => ({ label: a, value: parseAmount(a) }));
  const isCustom = (currentValue ?? "").length > 0 && !parsedAmounts.some(p => p.value === currentValue);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
      {parsedAmounts.map(({ label, value }) => {
        const active = currentValue === value;
        return (
          <button key={label} type="button" onClick={() => onSelect(value)}
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
      <button type="button"
        style={{
          padding: "4px 10px", borderRadius: "50px", fontSize: "11px",
          fontFamily: "var(--font-af)", fontWeight: isCustom ? 600 : 500, cursor: "pointer", transition: "all 140ms",
          color: isCustom ? "var(--color-hudson-blue)" : "var(--color-iron)",
          border: isCustom ? "1.5px solid var(--color-hudson-blue)" : "1px solid #c4c9c4",
          background: isCustom ? "rgba(0,129,192,0.08)" : "transparent",
        }}
        onClick={() => inputId && document.getElementById(inputId)?.focus()}
      >Other</button>
    </div>
  );
}

// ─── Allocation builder ───────────────────────────────────────────────────────

type AllocRow = { category: string; pct: string };

function parseAllocations(s: string): AllocRow[] {
  if (!s.trim()) return [];
  return s.split(/\n|,/).map(line => {
    const m = line.match(/^([^:]+):\s*(\d+)/);
    return m ? { category: m[1].trim(), pct: m[2] } : null;
  }).filter(Boolean) as AllocRow[];
}

function serializeAllocations(rows: AllocRow[]): string {
  return rows.filter(r => r.category).map(r => `${r.category}: ${r.pct}%`).join("\n");
}

function AllocationBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
    update([...rows, { category, pct: "" }]);
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
              placeholder={FUNDS_CHIPS[i] ?? "Category"}
              onChange={e => setCategory(i, e.target.value)}
              style={{ flex: 1, padding: "11px 14px", fontSize: "16px", fontFamily: "var(--font-af)", color: "var(--color-ink)", background: "transparent", border: "none", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 12px", borderLeft: "1px solid #eaece9", flexShrink: 0 }}>
              <input
                type="text"
                inputMode="numeric"
                value={row.pct}
                placeholder="0"
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "rgba(0,0,0,0.025)", borderTop: "1px solid #eaece9" }}>
          <span style={{ fontSize: "11px", color: "#5a5f5a", fontFamily: "var(--font-af)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total</span>
          <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-af)", fontVariantNumeric: "tabular-nums", color: totalOk ? "#22c55e" : totalOver ? "#dc2626" : "var(--color-ink)", transition: "color 200ms" }}>
            {total}%{totalOk && " ✓"}
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

function TagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

function Step6({ form }: { form: FormInstance }) {
  const { register, setValue, formState: { errors, touchedFields } } = form;
  const useOfFunds = (useWatch({ control: form.control, name: "useOfFunds" }) as string) || "";
  const raiseAmount = (useWatch({ control: form.control, name: "raiseAmount" }) as string) || "";
  const valuation   = (useWatch({ control: form.control, name: "valuationExpectation" }) as string) || "";
  const investors   = (useWatch({ control: form.control, name: "currentInvestors" }) as string) || "";

  return (
    <StaggeredFields>
      {/* Raise + Valuation with quick-select chips */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Raise amount" htmlFor="raiseAmount" error={errors.raiseAmount?.message} required
          why="Investors need to know whether the deal size fits their fund and check size."
        >
          <InputAdornment prefix="$">
            <StyledInput {...register("raiseAmount")} id="raiseAmount" placeholder="5,000,000" inputMode="decimal" autoComplete="off"
              valid={touchedFields.raiseAmount && !errors.raiseAmount && raiseAmount.length > 0}
              style={{ paddingLeft: "24px" }}
            />
          </InputAdornment>
          <AmountChips amounts={["$500K", "$1M", "$2M", "$5M", "$10M", "$20M"]} currentValue={raiseAmount} inputId="raiseAmount" onSelect={v => { setValue("raiseAmount", v, { shouldValidate: true, shouldTouch: true }); }} />
        </Field>
        <Field label="Pre-money valuation" htmlFor="valuationExpectation" error={errors.valuationExpectation?.message} required
          why="Valuation sets the terms conversation. State your expectation clearly — investors appreciate directness."
        >
          <InputAdornment prefix="$">
            <StyledInput {...register("valuationExpectation")} id="valuationExpectation" placeholder="25,000,000" inputMode="decimal" autoComplete="off"
              valid={touchedFields.valuationExpectation && !errors.valuationExpectation && valuation.length > 0}
              style={{ paddingLeft: "24px" }}
            />
          </InputAdornment>
          <AmountChips amounts={["$5M", "$10M", "$20M", "$50M", "$100M"]} currentValue={valuation} inputId="valuationExpectation" onSelect={v => { setValue("valuationExpectation", v, { shouldValidate: true, shouldTouch: true }); }} />
        </Field>
      </div>

      {/* Allocation builder */}
      <Field label="Use of funds" required
        hint="Where does the capital go? Add categories and percentages — should add up to 100%."
        error={errors.useOfFunds?.message}
        why="Use of funds shows capital discipline and strategic clarity. Investors want to know how their money creates the next milestone."
      >
        <AllocationBuilder
          value={useOfFunds}
          onChange={v => setValue("useOfFunds", v, { shouldValidate: true, shouldTouch: true })}
        />
      </Field>

      {/* Tag input for investors */}
      <Field label="Current investors" htmlFor="investor-tag-input"
        hint="Optional — press Enter or comma after each name."
        error={errors.currentInvestors?.message}
      >
        <TagInput
          value={investors}
          onChange={v => setValue("currentInvestors", v, { shouldValidate: true, shouldTouch: true })}
        />
      </Field>
    </StaggeredFields>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function IntakeForm({ engagementId, token }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [collected, setCollected] = useState<Partial<AllStepData>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY(engagementId));
      return saved ? (JSON.parse(saved) as Partial<AllStepData>) : {};
    } catch { return {}; }
  });

  const form: FormInstance = useForm<AllStepData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stepSchemas[step]) as any,
    mode: "onBlur",
    defaultValues: {
      companyName: "", oneLiner: "", sector: "", stage: undefined,
      problem: "", solution: "", marketSize: "",
      keyMetrics: "", growthRate: "", notableCustomers: "",
      teamMembers: [{ name: "", role: "", bio: "" }],
      currentRevenue: "", burnRate: "", runway: "", threeYearProjections: "",
      raiseAmount: "", valuationExpectation: "", useOfFunds: "", currentInvestors: "",
      ...collected,
    },
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(engagementId), JSON.stringify(collected)); } catch { /* ignore */ }
  }, [collected, engagementId]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "teamMembers" });

  async function handleNext(data: AllStepData) {
    const updated = { ...collected, ...data };
    setCollected(updated);
    setCompletedSteps(prev => new Set(Array.from(prev).concat(step)));

    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId, token, ...updated }),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error ?? "Submission failed");
      }
      localStorage.removeItem(STORAGE_KEY(engagementId));
      router.push(`/intake/${engagementId}/confirmed`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  function handleBack() {
    setCollected((c) => ({ ...c, ...form.getValues() }));
    setDirection(-1);
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  // Autosave pulse: fires whenever collected changes
  const [justSaved, setJustSaved] = useState(false);
  const prevCollectedRef = useRef(collected);
  useEffect(() => {
    if (prevCollectedRef.current !== collected) {
      prevCollectedRef.current = collected;
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1800);
      return () => clearTimeout(t);
    }
  }, [collected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-dvh px-4 pb-28 pt-8 sm:px-8 sm:pt-14"
      style={{ fontFamily: "var(--font-af)", "--color-fog": "#3d4438", "--color-steel": "#2d3028" } as React.CSSProperties}
    >
      <Cloudscape
        colorBottom="#a8c8e8" colorMid="#d4e8d4" colorTop="#e8e4f0" speed={1.2} height="100dvh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100dvh" }}
      />

      <div className="relative mx-auto w-full max-w-[560px]">
        {/* Brand + step counter */}
        <div className="mb-8 flex items-center justify-between">
          <span className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
            style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}>
            Pitch<span style={{ color: "var(--color-hudson-blue)" }}>Ready</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="text-[11px]" style={{ color: "var(--color-fog)", fontFamily: "var(--font-af)" }}>
              {STEP_TIME[step]}
            </span>
            <span className="text-[12px] font-[400] tabular-nums" style={{ color: "var(--color-fog)" }}>
              {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Segmented progress bar */}
        <SegmentedProgress step={step} total={STEPS.length} />

        {/* Step heading */}
        <div className="mb-6">
          <p className="mb-1.5 text-[11px] font-[600] uppercase tracking-[0.14em]" style={{ color: "var(--color-iron)" }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h1
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="text-[28px] font-[400] leading-[1.1] tracking-[-0.56px] sm:text-[40px]"
              style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
            >
              {STEPS[step]}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Step nav pills — with completed checkmarks */}
        <div className="mb-6 hidden gap-1.5 sm:flex">
          {STEPS.map((label, i) => (
            <span key={label}
              className="flex items-center gap-1 rounded-[50px] px-3 py-1 text-[12px]"
              style={{
                whiteSpace: "nowrap",
                fontWeight: i === step ? 500 : 400,
                background: i === step ? "var(--color-ink)" : completedSteps.has(i) ? "rgba(0,129,192,0.06)" : "transparent",
                color: i === step ? "white" : completedSteps.has(i) ? "var(--color-hudson-blue)" : "#3d4438",
                border: i === step ? "none" : completedSteps.has(i) ? "1px solid rgba(0,129,192,0.35)" : "1px solid rgba(0,0,0,0.28)",
                boxShadow: i === step ? "0 2px 8px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12)" : "none",
                transition: "all 200ms",
              }}
            >
              {completedSteps.has(i) && i !== step && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4.5" fill="rgba(0,129,192,0.15)" />
                  <path d="M3 5l1.5 1.5L7 3.5" stroke="var(--color-hudson-blue)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {label}
            </span>
          ))}
        </div>

        {/* Glassmorphic form card */}
        <form
          onSubmit={form.handleSubmit(handleNext)}
          className="rounded-[16px] p-6 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="space-y-5"
            >
              {step === 0 && <Step1 form={form} stageOptions={STAGE_OPTIONS} />}
              {step === 1 && <Step2 form={form} />}
              {step === 2 && <Step3 form={form} />}
              {step === 3 && <Step4 form={form} fields={fields} append={append} remove={remove} />}
              {step === 4 && <Step5 form={form} />}
              {step === 5 && <Step6 form={form} />}
            </motion.div>
          </AnimatePresence>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-[6px] px-4 py-3 text-[13px]"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
            >
              ⚠ {submitError}
            </motion.div>
          )}

          {/* Navigation — pinned inside card footer */}
          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: "10px" }}>
            {step > 0 && (
              <button type="button" onClick={handleBack}
                className="rounded-[8px] px-5 text-[14px] font-[500] transition-all"
                style={{ border: "1px solid rgba(0,0,0,0.12)", color: "var(--color-iron)", background: "rgba(255,255,255,0.6)", minHeight: "48px", cursor: "pointer", touchAction: "manipulation" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.9)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.6)"; }}
              >← Back</button>
            )}
            <button type="submit" disabled={submitting}
              className="flex-1 rounded-[8px] text-white disabled:opacity-50"
              style={{
                background: step === STEPS.length - 1 ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" : "var(--color-obsidian)",
                minHeight: step === STEPS.length - 1 ? "52px" : "48px",
                touchAction: "manipulation",
                fontSize: step === STEPS.length - 1 ? "13px" : "14px",
                fontWeight: step === STEPS.length - 1 ? 600 : 500,
                letterSpacing: step === STEPS.length - 1 ? "-0.01em" : "0",
                cursor: submitting ? "wait" : "pointer",
                transition: "opacity 150ms, box-shadow 200ms",
                boxShadow: step === STEPS.length - 1 ? "0 4px 16px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.15)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                  if (step === STEPS.length - 1) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.18)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                if (step === STEPS.length - 1) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.15)";
              }}
            >
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Sending your intake…
                </span>
              ) : step === STEPS.length - 1 ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", whiteSpace: "nowrap" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Submit — we'll build your deck
                </span>
              ) : "Continue →"}
            </button>
          </div>
        </form>

        {/* Autosave notice */}
        <motion.p
          className="mt-4 text-center text-[12px]"
          animate={{ opacity: justSaved ? 1 : 0.85, scale: justSaved ? 1.02 : 1 }}
          transition={{ duration: 0.3 }}
          style={{ color: "var(--color-fog)", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
        >
          <motion.svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            animate={{ color: justSaved ? "#22c55e" : "#3d4438" }}
            transition={{ duration: 0.3 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </motion.svg>
          {justSaved ? "Progress saved" : "Progress saved automatically"}
        </motion.p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
