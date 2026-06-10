"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AuditLog } from "@/components/admin/AuditLog";
import { FileUpload } from "@/components/admin/FileUpload";
import type { Engagement, IntakeFormData } from "@/lib/types";
import type { DeckSlide, ReportSection } from "@/lib/ai/types";

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "intake", label: "Intake" },
    { key: "deck", label: "Deck Draft" },
    { key: "report", label: "Report Draft" },
    { key: "files", label: "Files" },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI generation banner */}
      {initial.status === "drafting" && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <svg className="animate-spin h-4 w-4 text-amber-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm font-medium text-amber-800">
            AI generation in progress — the deck and report drafts will appear once complete. Refresh in a minute.
          </p>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0 min-h-[44px] flex items-center"
          >
            ← Back
          </button>
          <span className="text-gray-200 hidden sm:block">|</span>
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {initial.clientName || initial.clientEmail}
          </h1>
          <StatusBadge status={initial.status} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAuditOpen((o) => !o)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Audit log
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "intake" && (
            <IntakeTab engagement={initial} actorEmail={actorEmail} />
          )}
          {tab === "deck" && (
            <DeckTab engagement={initial} actorEmail={actorEmail} />
          )}
          {tab === "report" && (
            <ReportTab engagement={initial} actorEmail={actorEmail} />
          )}
          {tab === "files" && (
            <FilesTab engagement={initial} actorEmail={actorEmail} />
          )}
        </div>

        {/* Audit log sidebar */}
        {auditOpen && (
          <aside className="w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Audit log
              </h3>
              <AuditLog engagementId={initial.id} />
            </div>
          </aside>
        )}
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
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const textareaCls = `${inputCls} resize-none`;

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
    <div className="flex items-center gap-3 mt-6">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {extra}
      {saved && <span className="text-sm text-green-600">Saved</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
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
      <label className="block text-xs font-medium text-gray-600">{label}</label>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Intake data</h2>

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
        <p className="text-xs font-medium text-gray-600">Team members</p>
        {teamMembers.map((m, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Member {i + 1}
              </span>
              {teamMembers.length > 1 && (
                <button
                  onClick={() =>
                    setTeamMembers((t) => t.filter((_, idx) => idx !== i))
                  }
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              value={m.name}
              onChange={(e) =>
                setTeamMembers((t) =>
                  t.map((x, idx) =>
                    idx === i ? { ...x, name: e.target.value } : x
                  )
                )
              }
              placeholder="Name"
              className={inputCls}
            />
            <input
              value={m.role}
              onChange={(e) =>
                setTeamMembers((t) =>
                  t.map((x, idx) =>
                    idx === i ? { ...x, role: e.target.value } : x
                  )
                )
              }
              placeholder="Role"
              className={inputCls}
            />
            <textarea
              rows={2}
              value={m.bio}
              onChange={(e) =>
                setTeamMembers((t) =>
                  t.map((x, idx) =>
                    idx === i ? { ...x, bio: e.target.value } : x
                  )
                )
              }
              placeholder="Bio"
              className={textareaCls}
            />
          </div>
        ))}
        <button
          onClick={() =>
            setTeamMembers((t) => [...t, { name: "", role: "", bio: "" }])
          }
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
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
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {rerunning ? "Running…" : "Re-run AI draft"}
          </button>
        }
      />
    </div>
  );
}

// ─── Tab 2 — Deck ─────────────────────────────────────────────────────────────

const SLIDE_TYPE_COLORS: Record<string, string> = {
  title: "bg-purple-100 text-purple-700",
  problem: "bg-red-100 text-red-700",
  solution: "bg-green-100 text-green-700",
  market: "bg-blue-100 text-blue-700",
  traction: "bg-amber-100 text-amber-700",
  team: "bg-indigo-100 text-indigo-700",
  financials: "bg-teal-100 text-teal-700",
  ask: "bg-orange-100 text-orange-700",
  appendix: "bg-gray-100 text-gray-600",
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

  function updateSlide(i: number, patch: Partial<DeckSlide>) {
    setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await apiPost(
      `/api/admin/engagement/${engagement.id}/deck`,
      { deckOutline: slides }
    );
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-400">
        No deck draft yet. Generate one from the Intake tab.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                SLIDE_TYPE_COLORS[slide.slideType] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {slide.slideType}
            </span>
            <input
              value={slide.title}
              onChange={(e) => updateSlide(i, { title: e.target.value })}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Slide title"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500">
              Bullets (one per line)
            </label>
            <textarea
              rows={4}
              value={slide.bullets.join("\n")}
              onChange={(e) =>
                updateSlide(i, { bullets: e.target.value.split("\n") })
              }
              className={textareaCls}
              placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500">
              Speaker notes
            </label>
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
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
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
    setSections((s) =>
      s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec))
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await apiPost(
      `/api/admin/engagement/${engagement.id}/report`,
      { reportSections: sections }
    );
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-400">
        No report draft yet. Generate one from the Intake tab.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"
        >
          <input
            value={sec.heading}
            onChange={(e) => updateSection(i, { heading: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
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

  // For AI-generated files use the authenticated download route; for manually uploaded files
  // the Firebase Storage download URL (with embedded token) is stored in deckUrl/reportUrl.
  const hasDeck = !!(engagement.files?.deckPath || engagement.files?.deckUrl);
  const hasReport = !!(engagement.files?.reportPath || engagement.files?.reportUrl);
  const deckDownloadHref = engagement.files?.deckUrl
    ? engagement.files.deckUrl
    : engagement.files?.deckPath
    ? `/api/admin/engagement/${engagement.id}/download?type=deck`
    : null;
  const reportDownloadHref = engagement.files?.reportUrl
    ? engagement.files.reportUrl
    : engagement.files?.reportPath
    ? `/api/admin/engagement/${engagement.id}/download?type=report`
    : null;
  const [deckUrl, setDeckUrl] = useState(engagement.files?.deckUrl ?? "");
  const [reportUrl, setReportUrl] = useState(engagement.files?.reportUrl ?? "");

  async function updateStatus(newStatus: "approved" | "delivered") {
    setStatusSaving(true);
    setStatusError(null);
    const result = await apiPost(
      `/api/admin/engagement/${engagement.id}/status`,
      { status: newStatus }
    );
    setStatusSaving(false);
    if (result.ok) {
      setStatus(newStatus);
    } else {
      setStatusError(result.error ?? "Failed");
    }
  }

  async function handleFileUrls(updates: {
    deckUrl?: string;
    deckPath?: string;
    reportUrl?: string;
    reportPath?: string;
  }) {
    await apiPost(`/api/admin/engagement/${engagement.id}/files`, updates);
  }

  const mailtoHref = `mailto:${engagement.clientEmail}?subject=${encodeURIComponent(
    "Your Series A materials are ready"
  )}&body=${encodeURIComponent(
    `Hi ${engagement.clientName || "there"},\n\nYour Series A pitch materials are ready. Please find them attached.\n\nBest regards`
  )}`;

  return (
    <div className="space-y-6">
      {/* Downloads */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Download</h3>
        <div className="flex gap-3 flex-wrap">
          {deckDownloadHref ? (
            <a
              href={deckDownloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Download deck (.pptx)
            </a>
          ) : (
            <span className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm">
              No deck yet
            </span>
          )}
          {reportDownloadHref ? (
            <a
              href={reportDownloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Download report (.pdf)
            </a>
          ) : (
            <span className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm">
              No report yet
            </span>
          )}
        </div>
        {engagement.files?.deckError && !hasDeck && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <span className="font-semibold">Deck generation failed:</span>{" "}
            {engagement.files.deckError.message}
          </div>
        )}
        {engagement.files?.reportError && !hasReport && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <span className="font-semibold">Report generation failed:</span>{" "}
            {engagement.files.reportError.message}
          </div>
        )}
      </div>

      {/* Upload final versions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Upload final versions
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500">
              Final deck (.pptx)
            </p>
            <FileUpload
              storagePath={`engagements/${engagement.id}/final`}
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              label="Upload .pptx"
              onUploaded={(url, path) => {
                setDeckUrl(url);
                handleFileUrls({ deckUrl: url, deckPath: path });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500">
              Final report (.pdf)
            </p>
            <FileUpload
              storagePath={`engagements/${engagement.id}/final`}
              accept=".pdf,application/pdf"
              label="Upload .pdf"
              onUploaded={(url, path) => {
                setReportUrl(url);
                handleFileUrls({ reportUrl: url, reportPath: path });
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => updateStatus("approved")}
            disabled={statusSaving || status === "approved" || status === "delivered"}
            className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "approved" || status === "delivered"
              ? "Approved ✓"
              : "Approve"}
          </button>

          <a
            href={mailtoHref}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            Email client
          </a>

          <button
            onClick={() => updateStatus("delivered")}
            disabled={statusSaving || status === "delivered"}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "delivered" ? "Delivered ✓" : "Mark delivered"}
          </button>
        </div>

        {statusError && (
          <p className="text-sm text-red-600">{statusError}</p>
        )}

        <div className="pt-2 border-t border-gray-100">
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
