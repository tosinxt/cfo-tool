import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { redirect } from "next/navigation";
import { DEMO_MODE, DEMO_ACTOR } from "@/lib/demo";

export interface AdminActor {
  uid: string;
  email: string;
}

/** Verifies the __session cookie and checks role === 'admin' in Firestore.
 *  Redirects to /admin/login on failure (call from Server Components / Route Handlers). */
export async function verifyAdmin(): Promise<AdminActor> {
  if (DEMO_MODE) return DEMO_ACTOR;
  const cookieStore = cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) {
    redirect("/admin/login");
  }

  let decoded: Awaited<ReturnType<typeof adminAuth.verifySessionCookie>>;
  try {
    decoded = await adminAuth.verifySessionCookie(session, true);
  } catch {
    redirect("/admin/login");
  }

  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
    redirect("/admin/login");
  }

  return { uid: decoded.uid, email: decoded.email ?? "" };
}

/** Route Handler variant — throws instead of redirecting so you can return 403. */
export async function verifyAdminForApi(
  cookieHeader: string | null
): Promise<AdminActor> {
  if (DEMO_MODE) return DEMO_ACTOR;
  if (!cookieHeader) throw new Error("No session cookie");

  const match = cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/);
  const session = match?.[1];
  if (!session) throw new Error("No session cookie");

  const decoded = await adminAuth.verifySessionCookie(session, true);

  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
    throw new Error("Not admin");
  }

  return { uid: decoded.uid, email: decoded.email ?? "" };
}
