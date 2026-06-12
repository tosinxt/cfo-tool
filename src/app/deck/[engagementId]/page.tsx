import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { DEMO_MODE, DEMO_ENGAGEMENT_ID, DEMO_TOKEN } from "@/lib/demo";
import type { Engagement } from "@/lib/types";
import type { DeckSlide } from "@/lib/ai/types";
import DeckViewer from "./DeckViewer";
import Cloudscape from "@/components/forgeui/cloudscape";

export const metadata: Metadata = {
  title: "Your Pitch Deck — PitchReady",
  robots: { index: false, follow: false },
};

interface Props {
  params: { engagementId: string };
  searchParams: { token?: string };
}

function GateError({ message }: { message: string }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6"
      style={{ fontFamily: "var(--font-af)" }}>
      <Cloudscape colorBottom="#a8c8e8" colorMid="#d4e8d4" colorTop="#e8e4f0" speed={1.2} height="100dvh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100dvh" }} />
      <div className="relative w-full max-w-[400px] text-center">
        <div className="mb-10">
          <span className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
            style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}>
            Pitch<span style={{ color: "var(--color-hudson-blue)" }}>Ready</span>
          </span>
        </div>
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--color-linen)", border: "1px solid var(--color-sage)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-iron)" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="mb-3 text-[28px] font-[400] leading-[1.1] tracking-[-0.56px]"
          style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}>
          Access denied
        </h1>
        <p className="mb-8 text-[14px] leading-[1.6]" style={{ color: "var(--color-steel)" }}>{message}</p>
        <a href="mailto:support@pitchready.co"
          className="text-[14px] font-[500] underline underline-offset-4" style={{ color: "var(--color-iron)" }}>
          Contact support →
        </a>
      </div>
    </main>
  );
}

export default async function DeckPage({ params, searchParams }: Props) {
  const { engagementId } = params;
  const { token } = searchParams;

  if (!token) return <GateError message="This link is missing a required access token." />;

  // Demo mode
  if (DEMO_MODE && engagementId === DEMO_ENGAGEMENT_ID && token === DEMO_TOKEN) {
    return <DeckViewer engagementId={engagementId} token={token} companyName="Demo Co"
      slides={DEMO_SLIDES} hasDeckFile={false} status="drafting" />;
  }

  const docSnap = await adminDb.collection("engagements").doc(engagementId).get();
  if (!docSnap.exists) return <GateError message="Engagement not found." />;

  const engagement = { id: engagementId, ...docSnap.data() } as Engagement;

  if (engagement.intakeToken !== token) return <GateError message="This access token is invalid." />;

  const VIEWABLE_STATUSES = ["drafting", "ready_for_review", "approved", "delivered"];
  if (!VIEWABLE_STATUSES.includes(engagement.status)) {
    return <GateError message="Your deck isn't ready yet. Please complete your intake form first." />;
  }

  const slides: DeckSlide[] =
    (engagement.cfoEdits?.deckOutline as DeckSlide[] | undefined) ??
    (engagement.aiDraft?.deckOutline as DeckSlide[] | undefined) ??
    [];

  const hasDeckFile = !!(engagement.files?.deckPath || engagement.files?.deckUrl);

  return (
    <DeckViewer
      engagementId={engagementId}
      token={token}
      companyName={engagement.intake?.companyName ?? "Your Company"}
      slides={slides}
      hasDeckFile={hasDeckFile}
      status={engagement.status}
    />
  );
}

const DEMO_SLIDES: DeckSlide[] = [
  { slideType: "title", title: "Demo Company", bullets: ["Investor-ready pitch deck", "Powered by PitchReady"], speakerNotes: "" },
  { slideType: "problem", title: "The Problem", bullets: ["Market pain point 1", "Market pain point 2", "Why now"], speakerNotes: "" },
  { slideType: "solution", title: "Our Solution", bullets: ["What we built", "Key differentiator", "Why it works"], speakerNotes: "" },
];
