import type { Metadata, Viewport } from "next";
import { adminDb } from "@/lib/firebase/admin";
import IntakeChat from "./IntakeChat";
import GateError from "./GateError";
import type { Engagement } from "@/lib/types";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID, DEMO_TOKEN } from "@/lib/demo";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";

export const metadata: Metadata = {
  title: "Your Intake Interview",
  description: "Answer a few questions so we can build your investor-ready Series A pitch deck.",
  robots: { index: false, follow: false },
};

// Android Chrome: shrink the page when the keyboard opens, so the chat's
// composer stays above it. (iOS ignores this; IntakeChat handles iOS itself.)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

interface Props {
  params: { engagementId: string };
  searchParams: { token?: string };
}

export default async function IntakePage({ params, searchParams }: Props) {
  const { engagementId } = params;
  const { token } = searchParams;

  if (!token) {
    return <GateError message="This link is missing a required access token." />;
  }

  if (DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID && token === DEMO_TOKEN) {
    return <IntakeChat engagementId={engagementId} token={token} />;
  }

  const docSnap = await adminDb.collection("engagements").doc(engagementId).get();

  if (!docSnap.exists) {
    return <GateError message="Engagement not found." />;
  }

  const data = docSnap.data() as Engagement;

  if (!intakeTokenMatches(data.intakeToken, token)) {
    return <GateError message="This access token is invalid." />;
  }

  if (data.status !== "awaiting_intake") {
    return (
      <GateError
        message={
          data.status === "drafting" || data.status === "ready_for_review"
            ? "Your intake has already been submitted. Our team is working on your deck."
            : "This intake link is no longer active."
        }
      />
    );
  }

  // Whatever the founder already saved — from the written form or an earlier
  // session on another device — seeds the interview so nothing is re-asked.
  const serverAnswers: Record<string, unknown> = {};
  for (const [id, record] of Object.entries(data.intakeV2?.answers ?? {})) {
    serverAnswers[id] = record.value;
  }

  return (
    <IntakeChat
      engagementId={engagementId}
      token={token}
      serverAnswers={serverAnswers}
    />
  );
}
