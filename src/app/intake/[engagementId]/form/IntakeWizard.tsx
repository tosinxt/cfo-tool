"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { QUESTION_BANK } from "@/lib/intake/bank";
import {
  sectionSchema,
  sectionsForBranch,
  questionsForBranch,
  requiredQuestions,
} from "@/lib/intake/schema";
import {
  HELPER_BOILERPLATE,
  SECTION_LABELS,
  SKIPPED_WARNING_THRESHOLD,
  type AnswerValue,
  type Branch,
  type BusinessType,
  type Confidence,
  type IntakeV2,
  type QuestionDef,
  type SectionId,
} from "@/lib/intake/types";
import QuestionRenderer from "./QuestionRenderer";
import { Field, StyledInput, type AnyForm } from "./widgets";

type AnyValue = AnswerValue | undefined;
type Values = Record<string, AnyValue>;

const AUTOSAVE_DEBOUNCE_MS = 2000;
/** Rough pace used for the per-step time estimate shown in the rail. */
const MINUTES_PER_QUESTION = 0.4;

function estimateMinutes(count: number): number {
  return Math.max(1, Math.round(count * MINUTES_PER_QUESTION));
}

function defaultsFor(initial: IntakeV2 | null): Values {
  const values: Values = {};
  for (const q of QUESTION_BANK) values[q.id] = q.widget === "teamRepeater" ? [] : "";
  if (initial) {
    for (const [id, record] of Object.entries(initial.answers ?? {})) values[id] = record.value;
  }
  return values;
}

function withIdentity(values: Values, name?: string, email?: string): Values {
  if (name && !values.client_name) values.client_name = name;
  if (email && !values.client_email) values.client_email = email;
  return values;
}

function confidenceFor(initial: IntakeV2 | null): Record<string, Confidence> {
  const out: Record<string, Confidence> = {};
  for (const [id, record] of Object.entries(initial?.answers ?? {})) out[id] = record.confidence;
  return out;
}

export default function IntakeWizard({
  engagementId,
  token,
  initial,
  clientName: initialName,
  clientEmail: initialEmail,
}: {
  engagementId: string;
  token: string;
  initial: IntakeV2 | null;
  clientName?: string;
  clientEmail?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [businessType, setBusinessType] = useState<BusinessType | null>(
    initial?.business_type ?? null
  );
  const [branch, setBranch] = useState<Branch | null>(initial?.industry_branch ?? null);
  const [confidence, setConfidence] = useState<Record<string, Confidence>>(() =>
    confidenceFor(initial)
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [onReview, setOnReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const [waitlistEmail, setWaitlistEmail] = useState(initialEmail ?? "");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistBusy, setWaitlistBusy] = useState(false);

  const sections = useMemo(() => sectionsForBranch(branch), [branch]);
  const section = sections[Math.min(stepIdx, sections.length - 1)];
  const resolverSchema = useMemo(() => sectionSchema(section, { branch }), [section, branch]);

  const form = useForm<Values>({
    shouldUnregister: false,
    mode: "onBlur",
    defaultValues: withIdentity(defaultsFor(initial), initialName, initialEmail),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(resolverSchema as any) as any,
  }) as unknown as AnyForm;

  const questions = useMemo(
    () =>
      questionsForBranch(branch)
        .filter((q) => q.section === section)
        .sort((a, b) => a.order - b.order),
    [branch, section]
  );

  const ordered = useMemo(() => {
    const parents = questions.filter((q) => !q.parentId);
    const followUps = questions.filter((q) => q.parentId);
    const out: QuestionDef[] = [];
    for (const p of parents) {
      out.push(p);
      out.push(...followUps.filter((c) => c.parentId === p.id));
    }
    out.push(...followUps.filter((c) => !parents.some((p) => p.id === c.parentId)));
    return out;
  }, [questions]);

  /** Per-section question counts drive the time estimates in the rail. */
  const sectionSizes = useMemo(() => {
    const all = questionsForBranch(branch);
    const map: Partial<Record<SectionId, number>> = {};
    for (const s of sections) map[s] = all.filter((q) => q.section === s).length;
    return map;
  }, [branch, sections]);

  const minutesLeft = useMemo(
    () =>
      sections
        .slice(stepIdx)
        .reduce((sum, s) => sum + estimateMinutes(sectionSizes[s] ?? 0), 0),
    [sections, stepIdx, sectionSizes]
  );

  // ── Autosave ──────────────────────────────────────────────────────────────
  const dirty = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (dirty.current.size === 0) return;

    const values = form.getValues();
    const patch: Record<string, { value: AnswerValue; confidence?: Confidence }> = {};
    for (const id of Array.from(dirty.current)) {
      const value = values[id];
      if (value === undefined) continue;
      patch[id] = { value: value as AnswerValue, confidence: confidence[id] };
    }
    dirty.current.clear();
    setSaving(true);

    try {
      const res = await fetch("/api/intake/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          token,
          business_type: businessType ?? undefined,
          industry_branch: branch,
          patch,
        }),
      });
      if (res.ok) setSavedAt(new Date());
    } catch {
      // Offline or transient — the next flush retries with the same values.
    } finally {
      setSaving(false);
    }
  }, [form, confidence, engagementId, token, businessType, branch]);

  useEffect(() => {
    const sub = form.watch((_values, { name }) => {
      if (!name) return;
      dirty.current.add(name.split(".")[0]);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
    });
    return () => sub.unsubscribe();
  }, [form, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  // ── Completeness ──────────────────────────────────────────────────────────
  const required = useMemo(() => requiredQuestions(branch), [branch]);
  const skippedRatio = useMemo(() => {
    const values = form.getValues();
    const missing = required.filter((q) => {
      if (confidence[q.id] === "unknown") return true;
      const v = values[q.id];
      return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    });
    return required.length ? missing.length / required.length : 0;
  }, [required, confidence, form, onReview]);

  function setQuestionConfidence(id: string, c: Confidence) {
    setConfidence((prev) => ({ ...prev, [id]: c }));
    dirty.current.add(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS);
  }

  async function goNext() {
    const ids = ordered.map((q) => q.id);
    const valid = await form.trigger(ids);
    if (!valid) {
      // WCAG: send focus to the first field the founder needs to fix.
      const firstBad = ids.find(
        (id) => (form.formState.errors as Record<string, unknown>)[id]
      );
      if (firstBad) document.getElementById(firstBad)?.focus();
      return;
    }

    const chosen = form.getValues().industry_branch;
    if (chosen === "industrial" || chosen === "technology") setBranch(chosen);

    await flush();
    if (stepIdx >= sections.length - 1) setOnReview(true);
    else setStepIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function goBack() {
    if (onReview) {
      setOnReview(false);
      return;
    }
    if (stepIdx > 0) setStepIdx((i) => i - 1);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function jumpTo(i: number) {
    if (i === stepIdx && !onReview) return;
    void flush();
    setOnReview(false);
    setStepIdx(i);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    await flush();

    const values = form.getValues();
    const answers: Record<string, unknown> = {};
    for (const q of questionsForBranch(branch)) {
      if (q.section === "gate") continue;
      const v = values[q.id];
      if (v !== undefined) answers[q.id] = v;
    }

    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          token,
          business_type: businessType ?? "b2b",
          industry_branch: branch,
          answers,
          confidence,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Something went wrong submitting your intake.");
      }
      router.push(`/intake/${engagementId}/confirmed?token=${encodeURIComponent(token)}`);
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  }

  async function chooseBusinessType(value: BusinessType) {
    setBusinessType(value);
    try {
      await fetch("/api/intake/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId, token, business_type: value, patch: {} }),
      });
    } catch {
      // Non-blocking: the gate answer re-saves with the next autosave.
    }
  }

  async function submitWaitlist() {
    if (!waitlistEmail.trim()) return;
    setWaitlistBusy(true);
    try {
      await fetch("/api/intake/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engagementId,
          token,
          business_type: businessType ?? "b2c",
          patch: { client_email: { value: waitlistEmail.trim(), confidence: "confirmed" } },
        }),
      });
      setWaitlistDone(true);
    } catch {
      setWaitlistDone(true); // Don't strand them on a failure they can't act on.
    } finally {
      setWaitlistBusy(false);
    }
  }

  // ── Gate ──────────────────────────────────────────────────────────────────
  if (businessType === null) {
    return (
      <Shell narrow>
        <Eyebrow>Step 1 of 2</Eyebrow>
        <Display>Do you sell to other businesses?</Display>
        <Lede>
          This version is built for B2B companies. It takes about 20 minutes, and you
          can leave and come back at any point.
        </Lede>
        <div className="mt-7 flex flex-col gap-2">
          {[
            { value: "b2b" as const, label: "Yes, we sell to businesses", sub: "B2B" },
            { value: "b2c" as const, label: "No, we sell to consumers", sub: "B2C" },
            { value: "other" as const, label: "A mix of both", sub: "B2B and B2C" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => void chooseBusinessType(opt.value)}
              className="group"
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                textAlign: "left",
                borderRadius: "10px",
                padding: "16px 18px",
                background: "var(--color-paper)",
                border: "1px solid var(--color-mist)",
                transition: "border-color 160ms ease, box-shadow 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-hudson-blue)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,129,192,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-mist)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>
                <span style={{ display: "block", fontSize: "15px", fontWeight: 500, color: "var(--color-ink)" }}>
                  {opt.label}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "var(--color-steel)", marginTop: 2 }}>
                  {opt.sub}
                </span>
              </span>
              <Chevron />
            </button>
          ))}
        </div>
        <TrustNote />
      </Shell>
    );
  }

  if (businessType !== "b2b") {
    return (
      <Shell narrow>
        <Display>B2C support is coming</Display>
        {waitlistDone ? (
          <>
            <Lede>
              Thanks. We have your email and will get in touch the moment consumer
              businesses are supported.
            </Lede>
            <p className="mt-6 text-[13px]" style={{ color: "var(--color-steel)" }}>
              You can close this page.
            </p>
          </>
        ) : (
          <>
            <Lede>
              This version is built for B2B companies. Leave your email and we will tell
              you when consumer businesses are supported.
            </Lede>
            <div className="mt-6">
              <Field label="Email" htmlFor="waitlist-email">
                <StyledInput
                  id="waitlist-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                />
              </Field>
              <PrimaryButton
                onClick={() => void submitWaitlist()}
                disabled={waitlistBusy || !waitlistEmail.trim()}
                style={{ marginTop: 14 }}
              >
                {waitlistBusy ? "Saving…" : "Keep me posted"}
              </PrimaryButton>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setBusinessType(null)}
          className="mt-7 text-[13px] underline underline-offset-4"
          style={{ color: "var(--color-iron)", cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          That wasn&apos;t right, go back
        </button>
      </Shell>
    );
  }

  const values = form.getValues();

  // ── Review ────────────────────────────────────────────────────────────────
  if (onReview) {
    return (
      <Shell
        rail={
          <Rail
            sections={sections}
            stepIdx={sections.length}
            sizes={sectionSizes}
            onJump={jumpTo}
            reviewActive
          />
        }
      >
        <Eyebrow>Last step</Eyebrow>
        <Display>Review and submit</Display>
        <Lede>
          Check anything you estimated. Your CFO sees these flags, and will not treat a
          guess as a verified number.
        </Lede>

        {skippedRatio > SKIPPED_WARNING_THRESHOLD && (
          <div
            role="status"
            className="mt-6 rounded-[10px] px-4 py-3 text-[13px] leading-[1.6]"
            style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e" }}
          >
            <strong style={{ fontWeight: 600 }}>
              {Math.round(skippedRatio * 100)}% of the core questions are still open.
            </strong>{" "}
            We can still build a draft, but it will have gaps your investors will notice.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-7">
          {sections.map((s, i) => {
            const qs = questionsForBranch(branch).filter((q) => q.section === s);
            if (!qs.length) return null;
            return (
              <section key={s}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "var(--color-steel)",
                    }}
                  >
                    {SECTION_LABELS[s]}
                  </h2>
                  <button
                    type="button"
                    onClick={() => jumpTo(i)}
                    style={{
                      cursor: "pointer", background: "none", border: "none", padding: 0,
                      fontSize: "12px", fontWeight: 500, color: "var(--color-hudson-blue)",
                    }}
                  >
                    Edit
                  </button>
                </div>
                <dl className="flex flex-col">
                  {qs.map((q) => {
                    const v = values[q.id];
                    const conf = confidence[q.id] ?? "confirmed";
                    const text = Array.isArray(v)
                      ? v
                          .map((m) =>
                            typeof m === "string" ? m : `${m.name} — ${m.role}`
                          )
                          .join("\n")
                      : String(v ?? "");
                    const empty = !text.trim();
                    return (
                      <div
                        key={q.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(140px, 34%) 1fr",
                          gap: "14px",
                          padding: "10px 0",
                          borderTop: "1px solid var(--color-sage)",
                          alignItems: "start",
                        }}
                      >
                        <dt style={{ fontSize: "13px", color: "var(--color-steel)", lineHeight: 1.5 }}>
                          {q.label}
                        </dt>
                        <dd
                          style={{
                            fontSize: "13.5px",
                            lineHeight: 1.6,
                            color: empty ? "#b45309" : "var(--color-ink)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {empty ? "Not answered" : text}
                          {!empty && conf !== "confirmed" && (
                            <span
                              style={{
                                marginLeft: 8, fontSize: "11px", fontWeight: 600,
                                color: "var(--color-hudson-blue)", whiteSpace: "nowrap",
                              }}
                            >
                              {conf === "estimate" ? "Estimate" : "Don't know yet"}
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            );
          })}
        </div>

        {submitError && (
          <p className="mt-6 text-[13px]" role="alert" style={{ color: "#b91c1c" }}>
            {submitError}
          </p>
        )}

        <FooterBar
          left={<GhostButton onClick={goBack}>Back</GhostButton>}
          right={
            <>
              <SaveStatus saving={saving} savedAt={savedAt} />
              <PrimaryButton onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit to your CFO"}
              </PrimaryButton>
            </>
          }
        />
      </Shell>
    );
  }

  // ── Wizard step ───────────────────────────────────────────────────────────
  return (
    <Shell
      rail={
        <Rail sections={sections} stepIdx={stepIdx} sizes={sectionSizes} onJump={jumpTo} />
      }
    >
      <Eyebrow>
        Step {stepIdx + 1} of {sections.length} · about {minutesLeft} min left
      </Eyebrow>
      <Display>{SECTION_LABELS[section]}</Display>
      <Lede>{HELPER_BOILERPLATE}</Lede>

      {/* Deliberately NOT wrapped in AnimatePresence. A `mode="wait"` exit can
          wedge when the section changes twice in quick succession (e.g. jumping
          via the rail), leaving the previous section's questions mounted under
          the new heading. A decorative transition is not worth showing someone
          the wrong questions, so this is an enter-only fade keyed by section. */}
      <motion.div
        key={section}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
        className="mt-8 flex flex-col gap-7"
      >
        {ordered.map((q) => (
          <QuestionRenderer
            key={q.id}
            q={q}
            form={form}
            confidence={confidence[q.id] ?? "confirmed"}
            onConfidenceChange={(c) => setQuestionConfidence(q.id, c)}
          />
        ))}
      </motion.div>

      <FooterBar
        left={
          <GhostButton onClick={goBack} disabled={stepIdx === 0}>
            Back
          </GhostButton>
        }
        right={
          <>
            <SaveStatus saving={saving} savedAt={savedAt} />
            <PrimaryButton onClick={() => void goNext()}>
              {stepIdx >= sections.length - 1 ? "Review answers" : "Save and continue"}
            </PrimaryButton>
          </>
        }
      />
    </Shell>
  );
}

/* ── Layout primitives ──────────────────────────────────────────────────── */

function Shell({
  children,
  rail,
  narrow,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <main
      className="min-h-dvh"
      style={{ fontFamily: "var(--font-af)", background: "var(--color-linen)" }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--color-sage)",
          background: "var(--color-paper)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <span
            className="text-[15px] leading-none"
            style={{
              fontFamily: "var(--font-ppmondwest)",
              fontFeatureSettings: '"liga" 0',
              color: "var(--color-ink)",
            }}
          >
            Series A <span style={{ color: "var(--color-hudson-blue)" }}>HUB</span>
          </span>
          <span
            className="hidden text-[12px] sm:inline"
            style={{ color: "var(--color-steel)" }}
          >
            Reviewed by a CFO before anyone sees it
          </span>
        </div>
      </header>

      <div
        className={`mx-auto w-full px-5 pb-32 pt-9 sm:px-8 ${
          narrow ? "max-w-[520px]" : "max-w-[1100px]"
        }`}
      >
        {rail ? (
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <div className="lg:w-[228px] lg:flex-shrink-0">{rail}</div>
            <div className="min-w-0 flex-1 lg:max-w-[640px]">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}

/**
 * Labelled step rail. A twelve-section flow needs to answer "where am I, what
 * is left, can I go back" — twelve unlabelled slivers communicate length
 * without communicating structure.
 */
function Rail({
  sections,
  stepIdx,
  sizes,
  onJump,
  reviewActive,
}: {
  sections: SectionId[];
  stepIdx: number;
  sizes: Partial<Record<SectionId, number>>;
  onJump: (i: number) => void;
  reviewActive?: boolean;
}) {
  const pct = Math.round((Math.min(stepIdx, sections.length) / sections.length) * 100);
  return (
    <nav aria-label="Intake progress">
      {/* Mobile: a single bar. The full rail is desktop-only. */}
      <div className="lg:hidden">
        <div
          style={{
            height: 4, borderRadius: 999, background: "var(--color-sage)", overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`, height: "100%", borderRadius: 999,
              background: "var(--color-hudson-blue)", transition: "width 300ms ease",
            }}
          />
        </div>
        <p className="mt-2 text-[12px]" style={{ color: "var(--color-steel)" }}>
          {pct}% complete
        </p>
      </div>

      <ol className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-0.5">
        {sections.map((s, i) => {
          const done = i < stepIdx;
          const current = i === stepIdx && !reviewActive;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={current ? "step" : undefined}
                style={{
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  textAlign: "left",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  background: current ? "var(--color-paper)" : "transparent",
                  border: `1px solid ${current ? "var(--color-mist)" : "transparent"}`,
                  transition: "background 160ms ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    background: done
                      ? "var(--color-hudson-blue)"
                      : current
                        ? "var(--color-ink)"
                        : "var(--color-sage)",
                    color: done || current ? "#fff" : "var(--color-steel)",
                  }}
                >
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: "block", fontSize: 13, lineHeight: 1.3,
                      fontWeight: current ? 600 : 500,
                      color: current || done ? "var(--color-ink)" : "var(--color-steel)",
                    }}
                  >
                    {SECTION_LABELS[s]}
                  </span>
                  <span
                    style={{
                      display: "block", fontSize: 11, color: "var(--color-ash)",
                      fontVariantNumeric: "tabular-nums", marginTop: 1,
                    }}
                  >
                    ~{estimateMinutes(sizes[s] ?? 0)} min
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function FooterBar({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        background: "var(--color-paper)",
        borderTop: "1px solid var(--color-sage)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-5 py-3 sm:px-8">
        {left}
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </div>
  );
}

function SaveStatus({ saving, savedAt }: { saving: boolean; savedAt: Date | null }) {
  if (!saving && !savedAt) return null;
  return (
    <span
      aria-live="polite"
      className="hidden text-[12px] sm:inline"
      style={{ color: "var(--color-steel)", fontVariantNumeric: "tabular-nums" }}
    >
      {saving
        ? "Saving…"
        : `Saved ${savedAt!.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "8px",
        padding: "11px 20px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#fff",
        background: "var(--color-hudson-deep)",
        border: "none",
        opacity: disabled ? 0.45 : 1,
        minHeight: "44px",
        transition: "opacity 160ms ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "8px",
        padding: "11px 16px",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--color-iron)",
        background: "transparent",
        border: "1px solid var(--color-mist)",
        opacity: disabled ? 0.35 : 1,
        minHeight: "44px",
      }}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "var(--color-hudson-deep)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </p>
  );
}

function Display({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[27px] leading-[1.12] sm:text-[32px]"
      style={{
        fontFamily: "var(--font-ppmondwest)",
        fontFeatureSettings: '"liga" 0',
        letterSpacing: "-0.02em",
        color: "var(--color-ink)",
      }}
    >
      {children}
    </h1>
  );
}

function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-3 text-[14px] leading-[1.65]"
      style={{ color: "var(--color-steel)", maxWidth: "58ch" }}
    >
      {children}
    </p>
  );
}

function TrustNote() {
  return (
    <p
      className="mt-7 text-[12px] leading-[1.6]"
      style={{ color: "var(--color-ash)", maxWidth: "48ch" }}
    >
      Your answers are private, saved as you type, and reviewed by a CFO before they
      reach anyone else.
    </p>
  );
}

function Chevron() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-fog)" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
