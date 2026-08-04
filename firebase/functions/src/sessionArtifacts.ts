import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "./admin";
import type { SessionReview } from "./reviewSchema";

// Canonicalizes a Session Review into standalone Firestore records so the AI output actually
// appears across Recall (Tasks, Home, Calendar) instead of living only inside session_reviews/{id}.
//
// The ROOT-CAUSE fix: previously an extracted task only became a `tasks/{id}` document when a user
// manually clicked "Add to Tasks" on the review page. Here every extracted task is persisted
// automatically when analysis completes — with a STABLE, deterministic id so re-running analysis
// updates in place instead of duplicating, and without clobbering a user's status/completion.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Candidate = SessionReview["tasks"][number];

// Mirror of the frontend candidateToTaskInput (data/live/mappers.ts): same enum/deadline/owner rules
// so a server-created task and a client-promoted one are byte-identical for the same candidate.
export function taskFieldsFromCandidate(c: Candidate): { title: string; owner: string; deadline: string | null; priority: "red" | "amber" | "gray" } {
  const priority = c.priority === "red" || c.priority === "amber" || c.priority === "gray" ? c.priority : "gray";
  const deadline = c.deadline && ISO_DATE.test(c.deadline) ? c.deadline : null;
  const owner = c.owner && c.owner.trim() ? c.owner.trim() : "Unassigned";
  return { title: c.title.trim(), owner, deadline, priority };
}

export interface ArtifactSyncResult {
  created: number;
  updated: number;
  skipped: number;
}

/**
 * Upserts one `tasks/{sessionId}-t{index}` document per extracted candidate task.
 *   - Idempotent: the id is derived from session + candidate index (the SAME scheme the manual
 *     "Add to Tasks" promotion uses), so retries and manual promotion never create duplicates.
 *   - Non-destructive: an existing task's status/completion and created_at are preserved; only the
 *     AI-owned content fields (title/owner/deadline/priority + denormalized links) are refreshed.
 * Returns counts for logging + the backfill report.
 */
export async function syncSessionTasks(params: {
  sessionId: string;
  workspaceId: string;
  sessionTitle: string;
  projectId: string | null;
  review: SessionReview;
}): Promise<ArtifactSyncResult> {
  const { sessionId, workspaceId, projectId, sessionTitle, review } = params;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  await Promise.all(
    review.tasks.map(async (candidate, index) => {
      const fields = taskFieldsFromCandidate(candidate);
      if (!fields.title) {
        skipped++;
        return;
      }
      const ref = db.doc(`tasks/${sessionId}-t${index}`);
      const existing = await ref.get();
      if (existing.exists) {
        // Refresh AI content only — never touch the user's status/completed_at/created_at.
        await ref.update({
          title: fields.title,
          owner: fields.owner,
          deadline: fields.deadline,
          priority: fields.priority,
          project_id: projectId,
          source_session_title: sessionTitle,
          updated_at: FieldValue.serverTimestamp(),
        });
        updated++;
      } else {
        await ref.set({
          workspace_id: workspaceId,
          project_id: projectId,
          session_id: sessionId,
          ...fields,
          status: "todo",
          origin: "session",
          source_review_id: sessionId,
          source_candidate_index: index,
          source_session_title: sessionTitle,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });
        created++;
      }
    }),
  );

  logger.info("syncSessionTasks: done", { session_id: sessionId, created, updated, skipped });
  return { created, updated, skipped };
}

/** Stable, deterministic task id — the dedup key. Same scheme the client's promoteCandidateTask uses,
 *  so auto-created and manually-promoted tasks share one document (never a duplicate). */
export function taskIdFor(sessionId: string, index: number): string {
  return `${sessionId}-t${index}`;
}

/** ponytail: one runnable self-check — `node lib/sessionArtifacts.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  // Field rules must match the frontend candidateToTaskInput exactly (dedup depends on parity).
  assert.deepEqual(taskFieldsFromCandidate({ title: "  Do X ", owner: "  ", deadline: "next week", priority: "bogus" as Candidate["priority"], evidence: null }), {
    title: "Do X",
    owner: "Unassigned",
    deadline: null,
    priority: "gray",
  });
  assert.deepEqual(taskFieldsFromCandidate({ title: "Ship", owner: "Sam", deadline: "2026-08-10", priority: "red", evidence: null }), {
    title: "Ship",
    owner: "Sam",
    deadline: "2026-08-10",
    priority: "red",
  });
  // Stable id → retries/manual-promotion collapse onto one doc.
  assert.equal(taskIdFor("sess1", 0), "sess1-t0");
  console.log("sessionArtifacts self-check passed");
}
