import { EngagementDetail } from "../../engagement/[id]/EngagementDetail";
import { DEMO_ENGAGEMENT } from "@/lib/demo";
import type { Engagement } from "@/lib/types";

export default function PreviewDetailPage() {
  return (
    <EngagementDetail
      engagement={DEMO_ENGAGEMENT as unknown as Engagement}
      actorUid="preview"
      actorEmail="preview@admin.local"
    />
  );
}
