"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBreakdown } from "@/components/admin/StatusBreakdown";
import { StatusDot, STATUS_ORDER, STATUS_LABEL } from "@/components/admin/StatusDot";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DraftLegsCompact } from "@/components/admin/DraftLegs";
import type { Engagement, EngagementStatus } from "@/lib/types";

function tsToDate(ts: { seconds: number } | undefined): Date | null {
  if (!ts) return null;
  return new Date(ts.seconds * 1000);
}

function formatDate(ts: { seconds: number } | undefined): string {
  const d = tsToDate(ts);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function lastNDaysCounts(dates: Date[], n: number): number[] {
  const now = new Date();
  const buckets = new Array(n).fill(0);
  const dayMs = 86400000;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const d of dates) {
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const idx = n - 1 - Math.round((todayStart - dayStart) / dayMs);
    if (idx >= 0 && idx < n) buckets[idx]++;
  }
  return buckets;
}

type SortKey = "client" | "status" | "submitted" | "paid";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={`inline-block ml-1 transition-colors ${active ? "text-hudson-blue" : "text-gray-300"}`}
      style={{ transform: dir === "asc" ? "rotate(180deg)" : undefined }}
    >
      <path d="M5 7L1.5 3h7L5 7z" fill="currentColor" />
    </svg>
  );
}

interface AdminQueueProps {
  demoEngagements?: Engagement[];
}

export function AdminQueue({ demoEngagements }: AdminQueueProps = {}) {
  const router = useRouter();
  const [engagements, setEngagements] = useState<Engagement[]>(demoEngagements ?? []);
  const [loading, setLoading] = useState(!demoEngagements);
  const [authError, setAuthError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | "all">("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("submitted");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const searchRef = useRef<HTMLInputElement>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  useEffect(() => {
    if (demoEngagements) return; // skip Firestore in demo mode

    const q = query(collection(db, "engagements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEngagements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Engagement)));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        if (err.code === "permission-denied") setAuthError(true);
        setLoading(false);
      }
    );
    return unsub;
  }, [demoEngagements]);

  const filtered = useMemo(() => {
    const matches = engagements.filter((eng) => {
      if (statusFilter !== "all" && eng.status !== statusFilter) return false;
      if (search) {
        const haystack = `${eng.clientName ?? ""} ${eng.clientEmail ?? ""}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...matches].sort((a, b) => {
      if (sortKey === "client") {
        return dir * (a.clientName ?? "").localeCompare(b.clientName ?? "");
      }
      if (sortKey === "status") {
        return dir * (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
      }
      if (sortKey === "paid") {
        return dir * ((a.pricePaid ?? 0) - (b.pricePaid ?? 0));
      }
      const aTime = tsToDate(a.createdAt as unknown as { seconds: number })?.getTime() ?? 0;
      const bTime = tsToDate(b.createdAt as unknown as { seconds: number })?.getTime() ?? 0;
      return dir * (aTime - bTime);
    });
  }, [engagements, search, statusFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<EngagementStatus, number>;
    let revenueMtd = 0;
    const now = new Date();
    const createdDates: Date[] = [];

    for (const eng of engagements) {
      counts[eng.status] = (counts[eng.status] ?? 0) + 1;
      const paidAt = tsToDate(eng.paidAt);
      if (paidAt && paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear()) {
        revenueMtd += eng.pricePaid ?? 0;
      }
      const createdAt = tsToDate(eng.createdAt);
      if (createdAt) createdDates.push(createdAt);
    }

    const trend14 = lastNDaysCounts(createdDates, 14);

    return {
      counts,
      total: engagements.length,
      revenueMtd,
      readyForReview: counts.ready_for_review ?? 0,
      awaitingIntake: counts.awaiting_intake ?? 0,
      trend14,
    };
  }, [engagements]);

  // Keyboard navigation: J/K to move, Enter to open, / to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (isTyping) return;

      if (e.key === "j" || e.key === "J") {
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "k" || e.key === "K") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[activeIndex]) {
        router.push(`/admin/engagement/${filtered[activeIndex].id}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filtered, activeIndex, router]);

  useEffect(() => {
    setActiveIndex(0);
  }, [search, statusFilter]);

  return (
    <div className="min-h-screen bg-[oklch(98.5%_0.002_250)] flex font-body">
      <AdminSidebar active="dashboard" />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="h-14 shrink-0 border-b border-gray-200 bg-white px-4 flex items-center gap-3">
          <p className="text-[13px] text-gray-400 shrink-0">
            Admin <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-900 font-medium">Dashboard</span>
          </p>
          <div className="flex-1" />
          <div className="relative">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or email"
              className="h-9 w-[260px] rounded-md border border-gray-200 bg-gray-50 px-3 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hudson-blue/30 focus:bg-white transition-colors"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono">
              /
            </kbd>
          </div>
        </header>

        {demoEngagements && (
          <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-2 px-4">
            DEMO MODE — showing mock engagement data
          </div>
        )}

        <main className="flex-1 overflow-auto px-4 py-4 flex flex-col gap-4">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Awaiting your review"
              value={String(stats.readyForReview)}
              hero
              context="needs action now"
              sparkline={stats.trend14}
            />
            <MetricCard label="Total engagements" value={String(stats.total)} context="all time" />
            <MetricCard
              label="Revenue (MTD)"
              value={formatCurrency(stats.revenueMtd)}
              context="paid this month"
            />
            <MetricCard
              label="Awaiting intake"
              value={String(stats.awaitingIntake)}
              context="client hasn't submitted"
            />
          </div>

          {/* Context row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <StatusBreakdown counts={stats.counts} />
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-[12px] font-medium text-gray-500 mb-3">New engagements, last 14 days</p>
              <div className="text-hudson-blue">
                <svg width="100%" height="64" viewBox="0 0 280 64" preserveAspectRatio="none">
                  {(() => {
                    const data = stats.trend14;
                    const max = Math.max(...data, 1);
                    const step = 280 / (data.length - 1 || 1);
                    const points = data.map((v, i) => [i * step, 64 - (v / max) * 56 - 4] as const);
                    const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
                    const fill = `${line} L280,64 L0,64 Z`;
                    return (
                      <>
                        <defs>
                          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={fill} fill="url(#trend-fill)" stroke="none" />
                        <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`h-7 px-2.5 rounded-md text-[12px] font-medium border transition-colors ${
                statusFilter === "all"
                  ? "border-hudson-blue/30 bg-hudson-blue/10 text-hudson-blue"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              All
            </button>
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`h-7 px-2.5 rounded-md text-[12px] font-medium border transition-colors ${
                  statusFilter === status
                    ? "border-hudson-blue/30 bg-hudson-blue/10 text-hudson-blue"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {STATUS_LABEL[status]} <span className="text-gray-400 font-mono [font-variant-numeric:tabular-nums]">{stats.counts[status] ?? 0}</span>
              </button>
            ))}
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-[12px] text-gray-400 hover:text-gray-600 underline ml-1"
              >
                Reset
              </button>
            )}
            <span className="ml-auto text-[12px] text-gray-400">
              <kbd className="font-mono bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[11px]">J</kbd>
              <kbd className="font-mono bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[11px] ml-1">K</kbd> to navigate ·{" "}
              <kbd className="font-mono bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[11px]">Enter</kbd> to open
            </span>
          </div>

          {/* Table */}
          {loading && (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-11 border-b border-gray-100 last:border-0 px-3 flex items-center gap-4 animate-pulse">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
                </div>
              ))}
            </div>
          )}

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              Permission denied. Make sure you are signed in as an admin.
            </div>
          )}

          {!loading && !authError && filtered.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-8 text-center">
              <p className="text-[13px] text-gray-400">
                No engagements match{search || statusFilter !== "all" ? " these filters" : ""}.
              </p>
            </div>
          )}

          {!loading && !authError && filtered.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[12px] text-gray-400 font-medium">
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => toggleSort("client")}
                        className="inline-flex items-center hover:text-gray-700 transition-colors"
                      >
                        Client
                        <SortIcon active={sortKey === "client"} dir={sortKey === "client" ? sortDir : "desc"} />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center hover:text-gray-700 transition-colors"
                      >
                        Status
                        <SortIcon active={sortKey === "status"} dir={sortKey === "status" ? sortDir : "desc"} />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => toggleSort("submitted")}
                        className="inline-flex items-center hover:text-gray-700 transition-colors"
                      >
                        Submitted
                        <SortIcon active={sortKey === "submitted"} dir={sortKey === "submitted" ? sortDir : "desc"} />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <button
                        onClick={() => toggleSort("paid")}
                        className="inline-flex items-center hover:text-gray-700 transition-colors"
                      >
                        Paid
                        <SortIcon active={sortKey === "paid"} dir={sortKey === "paid" ? sortDir : "desc"} />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((eng, i) => (
                    <tr
                      key={eng.id}
                      onClick={() => router.push(`/admin/engagement/${eng.id}`)}
                      className={`group cursor-pointer transition-colors ${
                        i === activeIndex
                          ? "bg-hudson-blue/[0.06] border-l-2 border-l-hudson-blue"
                          : "hover:bg-gray-50 border-l-2 border-l-transparent"
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-gray-900">{eng.clientName || "—"}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-[12px]">{eng.clientEmail}</td>
                      <td className="px-3 py-2">
                        <StatusDot status={eng.status} />
                        {eng.status === "drafting" && (
                          <div className="mt-0.5">
                            <DraftLegsCompact progress={eng.draftProgress} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-400 font-mono [font-variant-numeric:tabular-nums] text-[12px]">
                        {formatDate((eng.createdAt as unknown as { seconds: number }) ?? undefined)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono [font-variant-numeric:tabular-nums] text-gray-700">
                        {eng.pricePaid ? formatCurrency(eng.pricePaid) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/engagement/${eng.id}`);
                          }}
                          title="Review engagement"
                          aria-label="Review engagement"
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-gray-100 hover:text-hudson-blue transition-opacity"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
                              stroke="currentColor"
                              strokeWidth="1.3"
                            />
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !authError && (
            <p className="text-[12px] text-gray-400 font-mono [font-variant-numeric:tabular-nums]">
              {filtered.length} of {engagements.length} engagements
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
