import type { Metadata } from "next";
import { verifyAdmin } from "@/lib/auth/verifyAdmin";
import { adminDb } from "@/lib/firebase/admin";
import type { Engagement } from "@/lib/types";
import { notFound } from "next/navigation";
import { EngagementDetail } from "./EngagementDetail";
import { DEMO_MODE, DEMO_ENGAGEMENT, DEMO_ENGAGEMENT_ID } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Engagement — Series A Pitch Tool",
  robots: { index: false, follow: false },
};

export default async function EngagementPage({
  params,
}: {
  params: { id: string };
}) {
  const actor = await verifyAdmin();

  if (DEMO_MODE && params.id === DEMO_ENGAGEMENT_ID) {
    return (
      <EngagementDetail
        engagement={DEMO_ENGAGEMENT as unknown as Engagement}
        actorUid={actor.uid}
        actorEmail={actor.email}
      />
    );
  }

  const docSnap = await adminDb
    .collection("engagements")
    .doc(params.id)
    .get();

  if (!docSnap.exists) notFound();

  // Firestore Admin SDK returns plain JS objects (Timestamps are server objects).
  // Serialise to JSON-safe form before passing to the Client Component.
  const raw = { id: docSnap.id, ...docSnap.data() };
  const engagement = JSON.parse(JSON.stringify(raw)) as Engagement;

  return (
    <EngagementDetail
      engagement={engagement}
      actorUid={actor.uid}
      actorEmail={actor.email}
    />
  );
}
