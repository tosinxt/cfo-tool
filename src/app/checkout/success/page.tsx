import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";

interface Props {
  searchParams: { session_id?: string };
}

async function findEngagementBySession(
  sessionId: string
): Promise<{ id: string; intakeToken: string } | null> {
  const snap = await adminDb
    .collection("engagements")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, intakeToken: doc.data().intakeToken as string };
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    return <ErrorState message="No session found. Please contact support." />;
  }

  // Retry up to 5 times (webhook may be a few seconds behind)
  let engagement: { id: string; intakeToken: string } | null = null;
  for (let i = 0; i < 5; i++) {
    engagement = await findEngagementBySession(sessionId);
    if (engagement) break;
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (!engagement) {
    return (
      <ErrorState message="We're still processing your payment — please wait a moment and refresh, or contact support." />
    );
  }

  redirect(`/intake/${engagement.id}?token=${engagement.intakeToken}`);
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500">{message}</p>
        <a
          href="mailto:support@yourdomain.com"
          className="inline-block text-indigo-600 font-medium hover:underline"
        >
          Contact support →
        </a>
      </div>
    </main>
  );
}

// Show a loading state while server component is rendering
export function generateStaticParams() {
  return [];
}
