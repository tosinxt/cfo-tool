import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import IntakeWizard from "./IntakeWizard";
import GateError from "../GateError";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID, DEMO_TOKEN } from "@/lib/demo";
import { intakeTokenMatches } from "@/lib/intake/authorizeIntakeToken";
import type { Engagement } from "@/lib/types";
import type { IntakeV2 } from "@/lib/intake/types";

export const metadata: Metadata = {
  title: "Your Intake Form",
  description: "Complete your intake form so we can build your investor-ready Series A pitch deck.",
  robots: { index: false, follow: false },
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

  // Demo mode: bypass all Firestore checks
  if (DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID && token === DEMO_TOKEN) {
    return <IntakeWizard engagementId={engagementId} token={token} initial={null} />;
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

  // Server-side resume: whatever was autosaved is handed straight to the
  // wizard, so a founder can pick up on a different device or browser.
  const initial: IntakeV2 | null = data.intakeV2
    ? (JSON.parse(JSON.stringify(data.intakeV2)) as IntakeV2)
    : null;

  return (
    <IntakeWizard
      engagementId={engagementId}
      token={token}
      initial={initial}
      clientName={data.clientName || undefined}
      clientEmail={data.clientEmail || undefined}
    />
  );
}
