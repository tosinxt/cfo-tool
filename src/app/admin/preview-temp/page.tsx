import { AdminQueue } from "../AdminQueue";
import { DEMO_ENGAGEMENT } from "@/lib/demo";
import type { Engagement } from "@/lib/types";

export default function PreviewPage() {
  const many: Engagement[] = Array.from({ length: 12 }).map((_, i) => ({
    ...(DEMO_ENGAGEMENT as unknown as Engagement),
    id: `demo-${i}`,
    clientName: `Founder ${i + 1}`,
    clientEmail: `founder${i + 1}@acme.io`,
    status: (["paid", "awaiting_intake", "drafting", "ready_for_review", "approved", "delivered"] as const)[i % 6],
    pricePaid: 299700,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - i * 86400, nanoseconds: 0 } as unknown as Engagement["createdAt"],
  }));
  return <AdminQueue demoEngagements={many} />;
}
