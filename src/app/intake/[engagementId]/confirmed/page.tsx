import type { Metadata } from "next";
import ConfirmedContent from "./ConfirmedContent";

export const metadata: Metadata = {
  title: "Intake Submitted — PitchReady",
  description:
    "Your intake form has been received. We'll have your pitch deck ready in 5–7 business days.",
};

interface Props {
  params: { engagementId: string };
  searchParams: { token?: string };
}

export default function ConfirmedPage({ params, searchParams }: Props) {
  return (
    <ConfirmedContent
      engagementId={params.engagementId}
      token={searchParams.token}
    />
  );
}
