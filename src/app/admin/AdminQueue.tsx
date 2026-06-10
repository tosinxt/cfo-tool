"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Engagement } from "@/lib/types";

function formatDate(ts: { seconds: number } | undefined): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface AdminQueueProps {
  demoEngagements?: Engagement[];
}

export function AdminQueue({ demoEngagements }: AdminQueueProps = {}) {
  const router = useRouter();
  const [engagements, setEngagements] = useState<Engagement[]>(demoEngagements ?? []);
  const [loading, setLoading] = useState(!demoEngagements);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (demoEngagements) return; // skip Firestore in demo mode

    const q = query(
      collection(db, "engagements"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEngagements(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Engagement))
        );
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {demoEngagements && (
        <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-2 px-4">
          DEMO MODE — showing mock engagement data
        </div>
      )}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">CFO Admin</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/settings")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Engagements</h2>
          <span className="text-sm text-gray-400">
            {engagements.length} total
          </span>
        </div>

        {loading && (
          <p className="text-sm text-gray-400">Loading…</p>
        )}

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Permission denied. Make sure you are signed in as an admin.
          </div>
        )}

        {!loading && !authError && engagements.length === 0 && (
          <p className="text-sm text-gray-400">No engagements yet.</p>
        )}

        {!loading && !authError && engagements.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Submitted</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {engagements.map((eng) => (
                    <tr key={eng.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {eng.clientName || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{eng.clientEmail}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={eng.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDate((eng.createdAt as unknown as { seconds: number }) ?? undefined)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/engagement/${eng.id}`)}
                          className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {engagements.map((eng) => (
                <div
                  key={eng.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {eng.clientName || "—"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{eng.clientEmail}</p>
                    </div>
                    <StatusBadge status={eng.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatDate((eng.createdAt as unknown as { seconds: number }) ?? undefined)}
                    </span>
                    <button
                      onClick={() => router.push(`/admin/engagement/${eng.id}`)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center px-4 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
