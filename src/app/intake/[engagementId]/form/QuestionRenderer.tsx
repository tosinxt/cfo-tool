"use client";

import React from "react";
import { useController, useFieldArray, useWatch } from "react-hook-form";
import type { Confidence, QuestionDef } from "@/lib/intake/types";
import {
  type AnyForm,
  Field,
  StyledInput,
  StyledTextarea,
  StyledSelect,
  CharTextarea,
  QuickChips,
  PillSelect,
  RadioPills,
  SliderPreset,
  MoneyField,
  AllocationBuilder,
  ProjectionRows,
  TagInput,
  TeamMemberRow,
} from "./widgets";

/**
 * Questions that produce deck narrative get a larger label and more room;
 * short factual fields stay compact. Without this every question reads as
 * equally important and founders can't tell where to invest effort.
 */
const NARRATIVE_WIDGETS = new Set(["textarea", "charTextarea"]);

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; short: string }[] = [
  { value: "confirmed", label: "Confirmed", short: "Confirmed" },
  { value: "estimate", label: "Estimate", short: "Estimate" },
  { value: "unknown", label: "Don't know yet", short: "Don't know" },
];

/**
 * Compact confidence control.
 *
 * Sits at low emphasis while the answer is "confirmed" (the default, and the
 * common case) and comes forward on hover, focus, or once the founder marks
 * anything less certain. A meta-control should not compete with the answer
 * it annotates.
 */
function ConfidenceControl({
  value,
  onChange,
  questionId,
}: {
  value: Confidence;
  onChange: (c: Confidence) => void;
  questionId: string;
}) {
  const [active, setActive] = React.useState(false);
  const raised = active || value !== "confirmed";

  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      role="radiogroup"
      aria-label={`How certain are you about this answer?`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "2px",
        borderRadius: "999px",
        border: `1px solid ${raised ? "var(--color-mist)" : "transparent"}`,
        background: raised ? "var(--color-paper)" : "transparent",
        opacity: raised ? 1 : 0.5,
        transition: "opacity 160ms ease, background 160ms ease, border-color 160ms ease",
      }}
    >
      {CONFIDENCE_OPTIONS.map((opt) => {
        const on = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            id={`${questionId}-conf-${opt.value}`}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            style={{
              cursor: "pointer",
              // Transparent vertical padding lifts the tap area to 44px while
              // the coloured pill inside stays visually small.
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              padding: "0 2px",
              border: "none",
              background: "transparent",
            }}
          >
            <span
              style={{
                borderRadius: "999px",
                padding: "3px 9px",
                fontSize: "11px",
                fontWeight: on ? 600 : 500,
                lineHeight: 1.5,
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
                color: on ? "var(--color-paper)" : "var(--color-steel)",
                // steel (not fog) keeps white label text above the 4.5:1 floor
                // while still reading quieter than the blue "needs attention" state.
                background: on
                  ? opt.value === "confirmed"
                    ? "var(--color-steel)"
                    : "var(--color-hudson-deep)"
                  : "transparent",
                transition: "background 160ms ease, color 160ms ease",
              }}
            >
              {opt.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function useStringField(form: AnyForm, name: string) {
  const { field } = useController({ control: form.control, name, defaultValue: "" });
  return {
    value: (field.value as string) ?? "",
    onChange: (v: string) => field.onChange(v),
    onBlur: field.onBlur,
  };
}

function TeamRepeater({ form, q }: { form: AnyForm; q: QuestionDef }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: q.id });
  const [expanded, setExpanded] = React.useState<number | null>(0);
  const errors = form.formState.errors as Record<string, unknown>;
  const teamErrors = errors[q.id] as
    | { [k: number]: { name?: { message?: string }; role?: { message?: string }; bio?: { message?: string } } }
    | undefined;

  React.useEffect(() => {
    if (fields.length === 0) append({ name: "", role: "", bio: "" });
  }, [fields.length, append]);

  return (
    <div className="flex flex-col gap-2">
      {fields.map((f, i) => (
        <TeamMemberRow
          key={f.id}
          index={i}
          form={form}
          fieldName={q.id}
          onRemove={() => remove(i)}
          expanded={expanded === i}
          onToggle={() => setExpanded(expanded === i ? null : i)}
          showRemove={fields.length > 1}
          teamErrors={teamErrors}
        />
      ))}
      {fields.length < 8 && (
        <button
          type="button"
          onClick={() => {
            append({ name: "", role: "", bio: "" });
            setExpanded(fields.length);
          }}
          className="self-start"
          style={{
            cursor: "pointer",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-hudson-blue)",
            background: "transparent",
            border: "1px dashed var(--color-mist)",
          }}
        >
          + Add person
        </button>
      )}
    </div>
  );
}

export default function QuestionRenderer({
  q,
  form,
  confidence,
  onConfidenceChange,
}: {
  q: QuestionDef;
  form: AnyForm;
  confidence: Confidence;
  onConfidenceChange: (c: Confidence) => void;
}) {
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const error = errors[q.id]?.message;
  const live = useWatch({ control: form.control, name: q.id });
  const filled =
    typeof live === "string" ? live.length > 0 : Array.isArray(live) && live.length > 0;

  const controlled = useStringField(form, q.id);
  const nested = Boolean(q.parentId);
  const narrative = NARRATIVE_WIDGETS.has(q.widget) && !nested;
  const showConfidence =
    q.widget !== "teamRepeater" && (filled || confidence !== "confirmed");

  const body = (() => {
    switch (q.widget) {
      case "textarea":
        return (
          <StyledTextarea
            {...form.register(q.id)}
            id={q.id}
            placeholder={q.placeholder}
            valid={filled && !error}
            rows={narrative ? 4 : 3}
          />
        );

      case "charTextarea":
        return (
          <CharTextarea
            {...form.register(q.id)}
            id={q.id}
            placeholder={q.placeholder}
            maxLength={400}
            currentLength={typeof live === "string" ? live.length : 0}
            valid={filled && !error}
          />
        );

      case "select":
        return (
          <StyledSelect {...form.register(q.id)} id={q.id}>
            <option value="">Select…</option>
            {q.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </StyledSelect>
        );

      case "radioPills":
      case "yesNo":
        return <RadioPills name={q.id} form={form} options={q.options ?? []} error={error} />;

      case "pillSelect":
        return (
          <PillSelect
            chips={q.examples ?? []}
            value={controlled.value}
            onChange={controlled.onChange}
            placeholder={q.placeholder}
            id={q.id}
            valid={filled && !error}
          />
        );

      case "slider":
        return (
          <SliderPreset
            presets={[
              { label: "12 mo", value: "12" },
              { label: "18 mo", value: "18" },
              { label: "24 mo", value: "24" },
            ]}
            sliderProps={{ min: 1, max: 48, step: 1, unit: "months", id: q.id }}
            value={controlled.value}
            onChange={controlled.onChange}
            onBlur={controlled.onBlur}
            valid={filled && !error}
          />
        );

      case "money":
        return <MoneyField form={form} name={q.id} id={q.id} placeholder={q.placeholder ?? "0"} />;

      case "allocation":
        return <AllocationBuilder value={controlled.value} onChange={controlled.onChange} />;

      case "projections":
        return <ProjectionRows value={controlled.value} onChange={controlled.onChange} />;

      case "tags":
        return <TagInput value={controlled.value} onChange={controlled.onChange} />;

      case "teamRepeater":
        return <TeamRepeater form={form} q={q} />;

      case "text":
      default:
        return (
          <StyledInput
            {...form.register(q.id)}
            id={q.id}
            placeholder={q.placeholder}
            valid={filled && !error}
          />
        );
    }
  })();

  return (
    <div
      style={
        nested
          ? {
              marginLeft: 10,
              paddingLeft: 16,
              borderLeft: "2px solid var(--color-sage)",
              paddingTop: 2,
              paddingBottom: 2,
            }
          : undefined
      }
    >
      <Field
        label={q.label}
        htmlFor={q.id}
        error={error}
        required={q.required}
        hint={q.helper}
        emphasis={narrative ? "lead" : "normal"}
        trailing={
          // Certainty is only a meaningful question once there is an answer to
          // be certain about, so this stays hidden until the field is filled.
          // That keeps a first-load screen from showing a column of identical
          // three-option controls next to every empty input.
          showConfidence ? (
            <ConfidenceControl
              questionId={q.id}
              value={confidence}
              onChange={onConfidenceChange}
            />
          ) : undefined
        }
      >
        {body}
        {q.examples && q.examples.length > 0 && q.widget !== "pillSelect" && (
          <QuickChips
            chips={q.examples}
            onSelect={(c) => form.setValue(q.id, c, { shouldValidate: true, shouldTouch: true })}
          />
        )}
      </Field>
    </div>
  );
}
