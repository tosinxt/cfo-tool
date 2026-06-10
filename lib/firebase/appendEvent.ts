import { adminDb } from "./admin";
import { FieldValue } from "firebase-admin/firestore";
import type { EngagementEventType } from "../types";

export async function appendEvent(
  engagementId: string,
  type: EngagementEventType,
  actorUid: string | null,
  actorEmail: string | null,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await adminDb
    .collection("engagements")
    .doc(engagementId)
    .collection("events")
    .add({
      engagementId,
      type,
      actorUid,
      actorEmail,
      description,
      metadata: metadata ?? {},
      createdAt: FieldValue.serverTimestamp(),
    });
}
