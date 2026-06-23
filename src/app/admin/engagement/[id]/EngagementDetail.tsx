"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { StatusDot } from "@/components/admin/StatusDot";
import { AuditLog } from "@/components/admin/AuditLog";
import { DraftLegsFull } from "@/components/admin/DraftLegs";
import { DesignPicker } from "@/components/admin/DesignPicker";
import type { Engagement, IntakeFormData } from "@/lib/types";
import type { DeckSlide, ReportSection } from "@/lib/ai/types";
import type { DesignSpec } from "@/lib/pptx/themes";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  engagement: Engagement;
  actorUid: string;
  actorEmail: string;
}

type Tab = "intake" | "deck" | "report" | "files";

// ─── Root component ───────────────────────────────────────────────────────────

export function EngagementDetail({ engagement: initial, actorEmail }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("intake");
  const [auditOpen, setAuditOpen] = useState(false);
  const [engagement, setEngagement] = useState<Engagement>(initial);

  // Live-subscribe so the draft pipeline's progress legs update without a manual refresh.
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "engagements", initial.id), (snap) => {
      if (snap.exists()) setEngagement({ id: initial.id, ...snap.data() } as Engagement);
    });
    return unsub;
  }, [initial.id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "intake", label: "Intake" },
    { key: "deck", label: "Deck draft" },
    { key: "report", label: "Report draft" },
    { key: "files", label: "Files" },
  ];

  return (
    <div className="min-h-screen bg-[oklch(98.5%_0.002_250)] flex font-body">
      <AdminSidebar active="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="h-14 shrink-0 border-b border-gray-200 bg-white px-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            ← Back
          </button>
          <span className="text-gray-200">/</span>
          <p className="text-[13px] text-gray-900 font-medium truncate">
            {engagement.clientName || engagement.clientEmail}
          </p>
          <StatusDot status={engagement.status} />
          <div className="flex-1" />
          <button
            onClick={() => setAuditOpen((o) => !o)}
            className={`h-8 px-2.5 rounded-md text-[12px] font-medium border transition-colors ${
              auditOpen
                ? "border-hudson-blue/30 bg-hudson-blue/10 text-hudson-blue"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            Audit log
          </button>
        </header>

        {/* AI generation banner — live progress legs */}
        {engagement.status === "drafting" && (
          <div className="bg-[oklch(97%_0.04_75)] border-b border-[oklch(85%_0.08_75)] px-4 py-3">
            <p className="text-[12px] font-medium text-[oklch(45%_0.13_75)] mb-2">
              AI generation in progress — drafts will appear once complete.
            </p>
            <DraftLegsFull progress={engagement.draftProgress} />
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto px-4 py-4">
            {/* Tab bar */}
            <div className="flex gap-4 mb-4 border-b border-gray-200">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`pb-2.5 px-0.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                    tab === t.key
                      ? "border-hudson-blue text-hudson-blue"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "intake" && <IntakeTab engagement={engagement} actorEmail={actorEmail} />}
            {tab === "deck" && <DeckTab engagement={engagement} actorEmail={actorEmail} />}
            {tab === "report" && <ReportTab engagement={engagement} actorEmail={actorEmail} />}
            {tab === "files" && <FilesTab engagement={engagement} actorEmail={actorEmail} />}
          </main>

          {/* Audit log sidebar */}
          {auditOpen && (
            <aside className="w-72 shrink-0 border-l border-gray-200 bg-white overflow-auto px-4 py-4">
              <p className="text-[12px] font-medium text-gray-500 mb-3">Audit log</p>
              <AuditLog engagementId={engagement.id} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiPost(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: json.error ?? "Request failed" };
  }
  return { ok: true };
}

const inputCls =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-hudson-blue/30 transition-colors";
const textareaCls = `${inputCls} resize-none`;
const cardCls = "rounded-lg border border-gray-200 bg-white p-4";

function SaveBar({
  saving,
  saved,
  error,
  onSave,
  extra,
}: {
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={onSave}
        disabled={saving}
        className="h-9 px-4 rounded-md bg-hudson-blue text-white text-[13px] font-semibold hover:bg-hudson-blue/90 disabled:opacity-60 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {extra}
      {saved && (
        <span className="text-[12px] text-[oklch(45%_0.12_150)] font-medium">Saved</span>
      )}
      {error && <span className="text-[12px] text-[oklch(50%_0.15_25)]">{error}</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-medium text-gray-500 mb-3">{children}</p>;
}

// ─── Tab 1 — Intake ───────────────────────────────────────────────────────────

function IntakeTab({
  engagement,
  actorEmail,
}: {
  engagement: Engagement;
  actorEmail: string;
}) {
  const initial = engagement.intake;
  const [form, setForm] = useState<Partial<IntakeFormData>>(initial ?? {});
  const [teamMembers, setTeamMembers] = useState(
    initial?.teamMembers ?? [{ name: "", role: "", bio: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);

  void actorEmail;

  function set(field: keyof IntakeFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const orig = (initial ?? {}) as unknown as Record<string, unknown>;
    const curr = form as unknown as Record<string, unknown>;
    const originalFields = Object.keys(orig);
    const fieldsChanged = originalFields.filter(
      (k) => JSON.stringify(orig[k]) !== JSON.stringify(curr[k])
    );

    const result = await apiPost(
      `/api/admin/engagement/${engagement.id}/intake`,
      { intake: { ...form, teamMembers }, fieldsChanged }
    );

    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error ?? "Failed to save");
    }
  }

  async function handleRerunDraft() {
    setRerunning(true);
    await fetch("/api/ai/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId: engagement.id }),
    });
    setRerunning(false);
  }

  const textField = (
    label: string,
    field: keyof IntakeFormData,
    placeholder?: string,
    multiline?: boolean
  ) => (
    <div className="space-y-1.5" key={field}>
      <label className="block text-[12px] font-medium text-gray-600">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={(form[field] as string) ?? ""}
          onChange={(e) => set(field, e.target.value)}
          placeholder={placeholder}
          className={textareaCls}
        />
      ) : (
        <input
          value={(form[field] as string) ?? ""}
          onChange={(e) => set(field, e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </div>
  );

  return (
    <div className={`${cardCls} space-y-5`}>
      <SectionLabel>Intake data</SectionLabel>

      <div className="grid grid-cols-2 gap-4">
        {textField("Company name", "companyName", "Acme Inc.")}
        {textField("Stage", "stage", "Series A")}
        {textField("One-liner", "oneLiner", "We help X do Y")}
        {textField("Sector", "sector", "FinTech")}
      </div>

      {textField("Problem", "problem", "What pain do you solve?", true)}
      {textField("Solution", "solution", "How do you solve it?", true)}
      {textField("Market size (TAM/SAM/SOM)", "marketSize")}
      {textField("Key metrics", "keyMetrics", "500 customers, $1.2M ARR", true)}
      {textField("Growth rate", "growthRate")}
      {textField("Notable customers", "notableCustomers")}

      <div className="space-y-3">
        <p className="text-[12px] font-medium text-gray-600">Team members</p>
        {teamMembers.map((m, i) => (
          <div key={i} className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-mono font-medium text-gray-400">
                MEMBER {i + 1}
              </span>
              {teamMembers.length > 1 && (
                <button
                  onClick={() => setTeamMembers((t) => t.filter((_, idx) => idx !== i))}
                  className="text-[11px] text-[oklch(50%_0.15_25)] hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              value={m.name}
              onChange={(e) =>
                setTeamMembers((t) => t.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
              }
              placeholder="Name"
              className={inputCls}
            />
            <input
              value={m.role}
              onChange={(e) =>
                setTeamMembers((t) => t.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)))
              }
              placeholder="Role"
              className={inputCls}
            />
            <textarea
              rows={2}
              value={m.bio}
              onChange={(e) =>
                setTeamMembers((t) => t.map((x, idx) => (idx === i ? { ...x, bio: e.target.value } : x)))
              }
              placeholder="Bio"
              className={textareaCls}
            />
          </div>
        ))}
        <button
          onClick={() => setTeamMembers((t) => [...t, { name: "", role: "", bio: "" }])}
          className="w-full py-2 rounded-md border border-dashed border-gray-200 text-[12px] text-gray-400 hover:border-hudson-blue/40 hover:text-hudson-blue transition-colors"
        >
          + Add member
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {textField("Current ARR / revenue", "currentRevenue")}
        {textField("Monthly burn rate", "burnRate")}
        {textField("Runway", "runway")}
        {textField("3-year projections", "threeYearProjections", "", true)}
        {textField("Raise amount", "raiseAmount")}
        {textField("Valuation expectation", "valuationExpectation")}
        {textField("Use of funds", "useOfFunds", "", true)}
        {textField("Current investors", "currentInvestors")}
      </div>

      <SaveBar
        saving={saving}
        saved={saved}
        error={error}
        onSave={handleSave}
        extra={
          <button
            onClick={handleRerunDraft}
            disabled={rerunning}
            className="h-9 px-4 rounded-md border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {rerunning ? "Running…" : "Re-run AI draft"}
          </button>
        }
      />
    </div>
  );
}

// ─── Tab 2 — Deck ─────────────────────────────────────────────────────────────

const SLIDE_TYPE_DOT: Record<string, string> = {
  title: "bg-[oklch(60%_0.1_300)]",
  problem: "bg-[oklch(58%_0.15_25)]",
  solution: "bg-[oklch(60%_0.12_150)]",
  market: "bg-[oklch(62%_0.12_240)]",
  traction: "bg-[oklch(72%_0.13_75)]",
  team: "bg-[oklch(58%_0.1_280)]",
  financials: "bg-hudson-blue",
  ask: "bg-[oklch(65%_0.15_45)]",
  appendix: "bg-gray-400",
};

function DeckTab({
  engagement,
  actorEmail,
}: {
  engagement: Engagement;
  actorEmail: string;
}) {
  void actorEmail;

  const source: DeckSlide[] =
    (engagement.cfoEdits?.deckOutline as DeckSlide[] | undefined) ??
    (engagement.aiDraft?.deckOutline as DeckSlide[] | undefined) ??
    [];

  const [slides, setSlides] = useState<DeckSlide[]>(source);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const design: DesignSpec | undefined = engagement.cfoEdits?.design ?? engagement.aiDraft?.design;
  const [designSaving, setDesignSaving] = useState(false);
  const [designSaved, setDesignSaved] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);

  async function handleSaveDesign(next: DesignSpec) {
    setDesignSaving(true);
    setDesignSaved(false);
    setDesignError(null);
    const result = await apiPost(`/api/admin/engagement/${engagement.id}/design`, next);
    setDesignSaving(false);
    if (result.ok) {
      setDesignSaved(true);
      setTimeout(() => setDesignSaved(false), 3000);
    } else {
      setDesignError(result.error ?? "Failed to save");
    }
  }

  function updateSlide(i: number, patch: Partial<DeckSlide>) {
    setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await apiPost(`/api/admin/engagement/${engagement.id}/deck`, { deckOutline: slides });
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error ?? "Failed to save");
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await fetch("/api/files/generate-pptx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId: engagement.id }),
    });
    setRegenerating(false);
  }

  if (slides.length === 0) {
    return (
      <div className={`${cardCls} text-[13px] text-gray-400`}>
        No deck draft yet. Generate one from the Intake tab.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DesignPicker
        value={design}
        saving={designSaving}
        saved={designSaved}
        error={designError}
        onSave={handleSaveDesign}
      />

      {slides.map((slide, i) => (
        <div key={i} className={`${cardCls} space-y-3`}>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-mono font-medium text-gray-500">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${SLIDE_TYPE_DOT[slide.slideType] ?? "bg-gray-400"}`} />
              {slide.slideType}
            </span>
            <input
              value={slide.title}
              onChange={(e) => updateSlide(i, { title: e.target.value })}
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-hudson-blue/30"
              placeholder="Slide title"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-500">Bullets (one per line)</label>
            <textarea
              rows={4}
              value={slide.bullets.join("\n")}
              onChange={(e) => updateSlide(i, { bullets: e.target.value.split("\n") })}
              className={textareaCls}
              placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-gray-500">Speaker notes</label>
            <textarea
              rows={2}
              value={slide.speakerNotes}
              onChange={(e) => updateSlide(i, { speakerNotes: e.target.value })}
              className={textareaCls}
              placeholder="Notes for the presenter…"
            />
          </div>
        </div>
      ))}

      <SaveBar
        saving={saving}
        saved={saved}
        error={error}
        onSave={handleSave}
        extra={
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="h-9 px-4 rounded-md border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {regenerating ? "Generating…" : "Regenerate .pptx"}
          </button>
        }
      />
    </div>
  );
}

// ─── Tab 3 — Report ───────────────────────────────────────────────────────────

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`${textareaCls} overflow-hidden`}
    />
  );
}

function ReportTab({
  engagement,
  actorEmail,
}: {
  engagement: Engagement;
  actorEmail: string;
}) {
  void actorEmail;

  const source: ReportSection[] =
    (engagement.cfoEdits?.reportSections as ReportSection[] | undefined) ??
    (engagement.aiDraft?.reportSections as ReportSection[] | undefined) ??
    [];

  const [sections, setSections] = useState<ReportSection[]>(source);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  function updateSection(i: number, patch: Partial<ReportSection>) {
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await apiPost(`/api/admin/engagement/${engagement.id}/report`, { reportSections: sections });
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error ?? "Failed to save");
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await fetch("/api/files/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engagementId: engagement.id }),
    });
    setRegenerating(false);
  }

  if (sections.length === 0) {
    return (
      <div className={`${cardCls} text-[13px] text-gray-400`}>
        No report draft yet. Generate one from the Intake tab.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((sec, i) => (
        <div key={i} className={`${cardCls} space-y-2.5`}>
          <input
            value={sec.heading}
            onChange={(e) => updateSection(i, { heading: e.target.value })}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-hudson-blue/30"
            placeholder="Section heading"
          />
          <AutoResizeTextarea
            value={sec.body}
            onChange={(v) => updateSection(i, { body: v })}
            placeholder="Section body…"
          />
        </div>
      ))}

      <SaveBar
        saving={saving}
        saved={saved}
        error={error}
        onSave={handleSave}
        extra={
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="h-9 px-4 rounded-md border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {regenerating ? "Generating…" : "Regenerate .pdf"}
          </button>
        }
      />
    </div>
  );
}

// ─── Tab 4 — Files ────────────────────────────────────────────────────────────

function FilesTab({
  engagement,
  actorEmail,
}: {
  engagement: Engagement;
  actorEmail: string;
}) {
  void actorEmail;

  const [status, setStatus] = useState(engagement.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  // AI-generated files are built on demand at download time — no Storage dependency,
  // available as soon as a draft exists.
  const hasDeck = !!engagement.aiDraft;
  const hasReport = !!engagement.aiDraft;
  const deckDownloadHref = hasDeck
    ? `/api/admin/engagement/${engagement.id}/download?type=deck`
    : null;
  const reportDownloadHref = hasReport
    ? `/api/admin/engagement/${engagement.id}/download?type=report`
    : null;

  async function updateStatus(newStatus: "approved" | "delivered") {
    setStatusSaving(true);
    setStatusError(null);
    const result = await apiPost(`/api/admin/engagement/${engagement.id}/status`, { status: newStatus });
    setStatusSaving(false);
    if (result.ok) {
      setStatus(newStatus);
    } else {
      setStatusError(result.error ?? "Failed");
    }
  }

  const mailtoHref = `mailto:${engagement.clientEmail}?subject=${encodeURIComponent(
    "Your Series A materials are ready"
  )}&body=${encodeURIComponent(
    `Hi ${engagement.clientName || "there"},\n\nYour Series A pitch materials are ready. Please find them attached.\n\nBest regards`
  )}`;

  return (
    <div className="space-y-3">
      {/* Downloads */}
      <div className={`${cardCls} space-y-3`}>
        <SectionLabel>Download</SectionLabel>
        <div className="flex gap-2.5 flex-wrap">
          {deckDownloadHref ? (
            <a
              href={deckDownloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-md bg-hudson-blue/10 text-hudson-blue text-[13px] font-medium hover:bg-hudson-blue/20 transition-colors inline-flex items-center"
            >
              Download deck (.pptx)
            </a>
          ) : (
            <span className="h-9 px-4 rounded-md bg-gray-100 text-gray-400 text-[13px] inline-flex items-center">
              No deck yet
            </span>
          )}
          {reportDownloadHref ? (
            <a
              href={reportDownloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-md bg-hudson-blue/10 text-hudson-blue text-[13px] font-medium hover:bg-hudson-blue/20 transition-colors inline-flex items-center"
            >
              Download report (.pdf)
            </a>
          ) : (
            <span className="h-9 px-4 rounded-md bg-gray-100 text-gray-400 text-[13px] inline-flex items-center">
              No report yet
            </span>
          )}
        </div>
        {engagement.files?.deckError && !hasDeck && (
          <div className="px-3 py-2 rounded-md bg-[oklch(97%_0.03_25)] border border-[oklch(85%_0.08_25)] text-[12px] text-[oklch(45%_0.15_25)]">
            <span className="font-semibold">Deck generation failed:</span> {engagement.files.deckError.message}
          </div>
        )}
        {engagement.files?.reportError && !hasReport && (
          <div className="px-3 py-2 rounded-md bg-[oklch(97%_0.03_25)] border border-[oklch(85%_0.08_25)] text-[12px] text-[oklch(45%_0.15_25)]">
            <span className="font-semibold">Report generation failed:</span> {engagement.files.reportError.message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`${cardCls} space-y-3`}>
        <SectionLabel>Actions</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => updateStatus("approved")}
            disabled={statusSaving || status === "approved" || status === "delivered"}
            className="h-9 px-4 rounded-md bg-[oklch(60%_0.12_150)] text-white text-[13px] font-semibold hover:bg-[oklch(55%_0.12_150)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "approved" || status === "delivered" ? "Approved ✓" : "Approve"}
          </button>

          <a
            href={mailtoHref}
            className="h-9 px-4 rounded-md bg-hudson-blue text-white text-[13px] font-semibold hover:bg-hudson-blue/90 transition-colors inline-flex items-center"
          >
            Email client
          </a>

          <button
            onClick={() => updateStatus("delivered")}
            disabled={statusSaving || status === "delivered"}
            className="h-9 px-4 rounded-md bg-[oklch(50%_0.1_220)] text-white text-[13px] font-semibold hover:bg-[oklch(45%_0.1_220)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "delivered" ? "Delivered ✓" : "Mark delivered"}
          </button>
        </div>

        {statusError && <p className="text-[12px] text-[oklch(50%_0.15_25)]">{statusError}</p>}

        <div className="pt-2 border-t border-gray-100">
          <StatusDot status={status} />
        </div>
      </div>
    </div>
  );
}
