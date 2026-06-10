"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function CfoSkillEditor() {
  const router = useRouter();
  const [addendum, setAddendum] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/cfo-skill")
      .then((r) => r.json())
      .then((d: { addendum?: string }) => setAddendum(d.addendum ?? ""))
      .catch(() => setBanner({ type: "error", msg: "Failed to load current addendum." }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/cfo-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addendum }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: unknown };
        throw new Error(JSON.stringify(json.error ?? "Save failed"));
      }
      setBanner({ type: "success", msg: "Saved. New engagements will use the updated methodology." });
    } catch (err) {
      setBanner({ type: "error", msg: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
          <span className="text-gray-200">|</span>
          <h1 className="text-base font-semibold text-gray-900">CFO Methodology Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Proprietary Expertise Addendum</h2>
          <p className="text-sm text-gray-500 mb-6">
            This text is injected into every AI generation call under a dedicated{" "}
            <strong>CFO Proprietary Methodology Notes</strong> section. Use it to encode your
            personal frameworks, red flags you prioritise, preferred narrative structures, or any
            guidance that makes your work distinct. Changes apply to all future draft generations —
            existing drafts are not affected.
          </p>

          {banner && (
            <div
              className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${
                banner.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {banner.msg}
            </div>
          )}

          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              Loading…
            </div>
          ) : (
            <textarea
              value={addendum}
              onChange={(e) => setAddendum(e.target.value)}
              rows={18}
              maxLength={8000}
              placeholder={
                "e.g.\n- I always push founders to anchor market size on a specific regulatory change or technology cost curve shift.\n- My signature move: reframe the 'use of funds' slide as 'the 18-month sprint plan' with named hires and milestone gates.\n- Flag any NRR below 100% as a deal-breaker that must be addressed head-on, not buried."
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{addendum.length} / 8000 characters</span>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save addendum"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
