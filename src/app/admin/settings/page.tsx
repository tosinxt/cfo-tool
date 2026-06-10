import type { Metadata } from "next";
import { verifyAdmin } from "@/lib/auth/verifyAdmin";
import { CfoSkillEditor } from "./CfoSkillEditor";

export const metadata: Metadata = {
  title: "Settings — Series A Pitch Tool",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await verifyAdmin();
  return <CfoSkillEditor />;
}
