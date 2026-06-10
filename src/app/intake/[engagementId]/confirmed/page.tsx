import type { Metadata } from "next";
import ConfirmedContent from "./ConfirmedContent";

export const metadata: Metadata = {
  title: "Intake Submitted — Series A Pitch Tool",
  description:
    "Your intake form has been received. We'll have your pitch deck ready in 5–7 business days.",
};

export default function ConfirmedPage() {
  return <ConfirmedContent />;
}
