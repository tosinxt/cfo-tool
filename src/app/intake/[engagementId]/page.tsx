import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import IntakeForm from "./IntakeForm";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID, DEMO_TOKEN } from "@/lib/demo";
import Cloudscape from "@/components/forgeui/cloudscape";

export const metadata: Metadata = {
  title: "Intake Form — Series A Pitch Tool",
  description: "Complete your intake form so we can build your investor-ready Series A pitch deck.",
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
    return <IntakeForm engagementId={engagementId} token={token} />;
  }

  const docSnap = await adminDb.collection("engagements").doc(engagementId).get();

  if (!docSnap.exists) {
    return <GateError message="Engagement not found." />;
  }

  const data = docSnap.data()!;

  if (data.intakeToken !== token) {
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

  return <IntakeForm engagementId={engagementId} token={token} />;
}

function GateError({ message }: { message: string }) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-6"
      style={{ fontFamily: "var(--font-af)" }}
    >
      <Cloudscape
        colorBottom="#a8c8e8"
        colorMid="#d4e8d4"
        colorTop="#e8e4f0"
        speed={1.2}
        height="100vh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100vh" }}
      />
      <div className="relative w-full max-w-[400px] text-center">
        {/* Brand */}
        <div className="mb-10">
          <span
            className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
            style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
          >
            Pitch<span style={{ color: "var(--color-hudson-blue)" }}>Ready</span>
          </span>
        </div>

        {/* Icon */}
        <div
          className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--color-linen)", border: "1px solid var(--color-sage)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-iron)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>

        <h1
          className="mb-3 text-[28px] font-[400] leading-[1.1] tracking-[-0.56px]"
          style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
        >
          Access denied
        </h1>
        <p className="mb-8 text-[14px] leading-[1.6]" style={{ color: "var(--color-steel)" }}>
          {message}
        </p>
        <a
          href="mailto:support@pitchready.co"
          className="text-[14px] font-[500] underline underline-offset-4 transition-colors"
          style={{ color: "var(--color-iron)", textDecorationColor: "var(--color-sage)" }}
        >
          Contact support →
        </a>
      </div>
    </main>
  );
}
