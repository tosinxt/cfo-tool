import { adminDb } from "@/lib/firebase/admin";

const CONFIG_DOC = "config/cfoSkill";

/** Returns the CFO's custom methodology addendum, or empty string if not set. */
export async function fetchCfoAddendum(): Promise<string> {
  try {
    const snap = await adminDb.doc(CONFIG_DOC).get();
    if (!snap.exists) return "";
    const data = snap.data() as { addendum?: string } | undefined;
    return data?.addendum?.trim() ?? "";
  } catch (err) {
    console.error("[fetchCfoAddendum] failed to load, proceeding without addendum:", err);
    return "";
  }
}
