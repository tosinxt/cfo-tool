import type { Metadata } from "next";
import { verifyAdmin } from "@/lib/auth/verifyAdmin";
import { AdminQueue } from "./AdminQueue";
import { DEMO_MODE, DEMO_ENGAGEMENT } from "@/lib/demo";
import type { Engagement } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Dashboard — Series A Pitch Tool",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await verifyAdmin();
  if (DEMO_MODE) {
    return <AdminQueue demoEngagements={[DEMO_ENGAGEMENT as unknown as Engagement]} />;
  }
  return <AdminQueue />;
}
