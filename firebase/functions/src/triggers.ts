import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

// New workspaces auto-enroll their creator as the owner member doc, so
// workspaces/{id}/members never needs a bootstrapping client-side write.
export const onWorkspaceCreated = onDocumentCreated(
  "workspaces/{workspaceId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { workspaceId } = event.params;
    const ownerId = snap.data().owner_id as string | undefined;
    if (!ownerId) return;

    await db.doc(`workspaces/${workspaceId}/members/${ownerId}`).set({
      role: "owner",
      created_at: FieldValue.serverTimestamp(),
    });
  }
);

// updated_at stamping — mirrors the Supabase set_updated_at() trigger for each
// collection that has an updated_at field. Skips re-firing when the write only
// touched updated_at itself, to avoid an infinite update loop.
function makeUpdatedAtTrigger(collectionPath: string) {
  return onDocumentUpdated(collectionPath, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (after.updated_at !== before.updated_at) return;

    await event.data?.after.ref.update({
      updated_at: FieldValue.serverTimestamp(),
    });
  });
}

export const onWorkspaceUpdated = makeUpdatedAtTrigger("workspaces/{workspaceId}");
export const onSessionUpdated = makeUpdatedAtTrigger("sessions/{sessionId}");
export const onSessionReviewUpdated = makeUpdatedAtTrigger("session_reviews/{reviewId}");
export const onProjectUpdated = makeUpdatedAtTrigger("projects/{projectId}");
export const onTaskUpdated = makeUpdatedAtTrigger("tasks/{taskId}");
