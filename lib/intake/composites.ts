/**
 * Parse/serialize helpers for the intake's composite string fields.
 *
 * Several answers are structured data stored as a single serialized string
 * ("TAM: $50B | SAM: $8B"). The wire format is load-bearing: the AI draft
 * prompt and the admin editor both read it, so it must round-trip exactly.
 */

// ─── Market size ──────────────────────────────────────────────────────────────

export const MARKET_KEYS = [
  { key: "TAM", sub: "Total market", placeholder: "50B" },
  { key: "SAM", sub: "Serviceable", placeholder: "8B" },
  { key: "SOM", sub: "Obtainable", placeholder: "400M" },
] as const;

export function parseMarketSize(s: string): { tam: string; sam: string; som: string; note: string } {
  const grab = (k: string) => {
    // Round-trip format first ("TAM: $50B"), then loose narrative from the
    // AI chat or an old draft ("$18B TAM (GRC software)").
    const strict = s.match(new RegExp(`${k}:\\s*\\$?([^|]*)`, "i"));
    if (strict) return strict[1].trim();
    const loose = s.match(new RegExp(`\\$?([\\d.,]+\\s?[KMBkmb]?)\\s*${k}`, "i"));
    return loose ? loose[1].replace(/\s/g, "") : "";
  };
  return {
    tam: grab("TAM"), sam: grab("SAM"), som: grab("SOM"),
    note: (s.match(/Note:\s*([^|]+)/i)?.[1] ?? "").trim(),
  };
}

export function serializeMarketSize(tam: string, sam: string, som: string, note: string): string {
  const parts: string[] = [];
  if (tam) parts.push(`TAM: $${tam}`);
  if (sam) parts.push(`SAM: $${sam}`);
  if (som) parts.push(`SOM: $${som}`);
  if (note) parts.push(`Note: ${note}`);
  return parts.join(" | ");
}

// ─── Key metrics ──────────────────────────────────────────────────────────────

export type MetricRowData = { label: string; value: string };

export const METRIC_PLACEHOLDERS: Record<string, string> = {
  ARR: "$1.2M", MRR: "$100K", NRR: "118%", Churn: "2% monthly",
  Customers: "480", DAUs: "12,000", CAC: "$1,200", LTV: "$28,000",
  GMV: "$4M", "Gross margin": "78%",
};

export function parseMetrics(s: string): MetricRowData[] {
  if (!s.trim()) return [];
  return s.split(/\s*·\s*/).map((part) => {
    const m = part.match(/^([^:]{1,40}):\s*(.*)$/);
    return m ? { label: m[1].trim(), value: m[2].trim() } : { label: part.trim(), value: "" };
  }).filter((r) => r.label || r.value);
}

export function serializeMetrics(rows: MetricRowData[]): string {
  return rows
    .filter((r) => r.label.trim() || r.value.trim())
    .map((r) => (r.label.trim() && r.value.trim()
      ? `${r.label.trim()}: ${r.value.trim()}`
      : r.label.trim() || r.value.trim()))
    .join(" · ");
}

// ─── Projections ──────────────────────────────────────────────────────────────

/** Years of forecast collected. Brent to confirm; 3 is the working default. */
export const PROJECTION_YEARS = 3;

export function parseProjections(s: string): { years: string[]; note: string } {
  const clean = (v: string) => v.replace(/^\$+/, "").trim();
  const years = Array.from({ length: PROJECTION_YEARS }, (_, i) =>
    clean(s.match(new RegExp(`Year ${i + 1}:\\s*\\$?([^\\|]*)`))?.[1] ?? "")
  );
  return { years, note: (s.match(/Note:\s*([^\|]+)/)?.[1] ?? "").trim() };
}

// Only filled years — an all-placeholder skeleton would both pass the
// min-length validation with no data and pollute the deck string.
export function serializeProjections(years: string[], note: string): string {
  const parts: string[] = [];
  years.forEach((v, i) => { if (v) parts.push(`Year ${i + 1}: $${v}`); });
  if (note) parts.push(`Note: ${note}`);
  return parts.join(" | ");
}

// ─── Money ────────────────────────────────────────────────────────────────────

export function onlyDigits(s: string): boolean {
  return /^\d+$/.test(s);
}

export function formatThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Accepts "5m", "500k", "1.2b", "$5,000,000" → plain integer digit string.
// Returns "" when the text isn't a single parseable amount.
export function normalizeMoney(raw: string): string {
  const s = raw.replace(/[$,\s]/g, "").toLowerCase();
  if (!s) return "";
  const m = s.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
  if (!m) return "";
  const mult = m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : m[2] === "b" ? 1e9 : 1;
  const n = Math.round(parseFloat(m[1]) * mult);
  return isFinite(n) ? String(n) : "";
}

export function abbreviateMoney(digits: string): string {
  const n = parseInt(digits, 10);
  if (!isFinite(n)) return "";
  const fmt = (v: number, suffix: string) => `$${parseFloat(v.toFixed(1))}${suffix}`;
  if (n >= 1e9) return fmt(n / 1e9, "B");
  if (n >= 1e6) return fmt(n / 1e6, "M");
  if (n >= 1e3) return fmt(n / 1e3, "K");
  return `$${n}`;
}

// ─── Use of funds allocation ──────────────────────────────────────────────────

export type AllocRow = { category: string; pct: string };

export function parseAllocations(s: string): AllocRow[] {
  if (!s.trim()) return [];
  return s.split(/\n|,/).map(line => {
    const m = line.match(/^([^:]+):\s*(\d+)/);
    return m ? { category: m[1].trim(), pct: m[2] } : null;
  }).filter(Boolean) as AllocRow[];
}

export function serializeAllocations(rows: AllocRow[]): string {
  // Only complete rows — a category without a percentage would emit
  // "Sales: %" junk into the deck data.
  return rows.filter(r => r.category.trim() && r.pct).map(r => `${r.category.trim()}: ${r.pct}%`).join("\n");
}

// ─── Tags (comma-joined) ──────────────────────────────────────────────────────

export function parseTags(s: string): string[] {
  return s.split(",").map(t => t.trim()).filter(Boolean);
}

export function serializeTags(tags: string[]): string {
  return tags.map(t => t.trim()).filter(Boolean).join(", ");
}
