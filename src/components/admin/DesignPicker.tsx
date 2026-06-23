"use client";

import { useEffect, useState } from "react";
import { PPTX_THEMES, THEME_IDS } from "@/lib/pptx/themes";
import type { DesignSpec, FinancialsLayout, TeamLayout, ThemeId } from "@/lib/pptx/themes";

interface Props {
  value: DesignSpec | undefined;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: (next: DesignSpec) => void;
}

const cardCls = "rounded-lg border border-gray-200 bg-white p-4";

export function DesignPicker({ value, saving, saved, error, onSave }: Props) {
  const [themeId, setThemeId] = useState<ThemeId>(value?.themeId ?? "midnight");
  const [financialsLayout, setFinancialsLayout] = useState<FinancialsLayout>(value?.financialsLayout ?? "cards");
  const [teamLayout, setTeamLayout] = useState<TeamLayout>(value?.teamLayout ?? "grid");

  // Keep local selection in sync if the underlying engagement doc changes
  // (e.g. the AI design stage finishes after this tab is already mounted).
  useEffect(() => {
    if (value) {
      setThemeId(value.themeId);
      setFinancialsLayout(value.financialsLayout);
      setTeamLayout(value.teamLayout);
    }
  }, [value]);

  const dirty =
    !value || value.themeId !== themeId || value.financialsLayout !== financialsLayout || value.teamLayout !== teamLayout;

  return (
    <div className={`${cardCls} space-y-3`}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-gray-500">
          Deck design {value ? <span className="text-gray-400">— {value.rationale === "Chosen manually by admin" ? "set by admin" : "chosen by AI"}</span> : null}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {THEME_IDS.map((id) => {
          const t = PPTX_THEMES[id];
          const active = themeId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setThemeId(id)}
              title={t.description}
              className={`text-left rounded-md border p-2.5 transition-colors ${
                active ? "border-hudson-blue ring-2 ring-hudson-blue/20" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span
                className="block h-8 w-full rounded-sm mb-2"
                style={{ background: `#${t.bg}`, boxShadow: `inset 0 0 0 2px #${t.accent}` }}
              />
              <span className="block text-[12px] font-medium text-gray-900">{t.name}</span>
              <span className="block text-[10.5px] text-gray-400 leading-snug mt-0.5">{t.description}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[12px] text-gray-600">
          Financials layout
          <select
            value={financialsLayout}
            onChange={(e) => setFinancialsLayout(e.target.value as FinancialsLayout)}
            className="h-8 rounded-md border border-gray-200 px-2 text-[12px]"
          >
            <option value="cards">Cards</option>
            <option value="table">Table</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[12px] text-gray-600">
          Team layout
          <select
            value={teamLayout}
            onChange={(e) => setTeamLayout(e.target.value as TeamLayout)}
            className="h-8 rounded-md border border-gray-200 px-2 text-[12px]"
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => onSave({ themeId, financialsLayout, teamLayout, rationale: "Chosen manually by admin" })}
          className="h-8 px-3.5 rounded-md bg-hudson-blue text-white text-[12px] font-medium disabled:opacity-50 hover:bg-hudson-blue/90 transition-colors"
        >
          {saving ? "Saving…" : "Use this design"}
        </button>
        {saved && <span className="text-[12px] text-green-600">Saved</span>}
        {error && <span className="text-[12px] text-red-600">{error}</span>}
      </div>
    </div>
  );
}
