"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { EngagementEventType } from "@/lib/types";

interface AuditEvent {
  id: string;
  type: EngagementEventType;
  actorEmail: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: { seconds: number } | null;
}

const TYPE_LABELS: Partial<Record<EngagementEventType, string>> = {
  engagement_created: "Created",
  payment_confirmed: "Payment confirmed",
  intake_submitted: "Intake submitted",
  draft_generated: "Draft generated",
  intake_edit: "Intake edited",
  deck_edit: "Deck edited",
  report_edit: "Report edited",
  edits_saved: "Edits saved",
  approved: "Approved",
  delivered: "Delivered",
};

function formatTs(ts: { seconds: number } | null): string {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleString();
}

export function AuditLog({ engagementId }: { engagementId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "engagements", engagementId, "events"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditEvent, "id">) }))
      );
    });
    return unsub;
  }, [engagementId]);

  if (events.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-4 text-center">No events yet.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((ev) => (
        <li key={ev.id} className="text-xs">
          <p className="font-medium text-gray-700">
            {TYPE_LABELS[ev.type] ?? ev.type}
          </p>
          <p className="text-gray-500">{ev.description}</p>
          <p className="text-gray-400 mt-0.5">
            {ev.actorEmail ?? "system"} · {formatTs(ev.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
