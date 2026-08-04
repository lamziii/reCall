// DEV-ONLY backfill: turn existing completed session reviews into canonical task records + the
// denormalized session summary/counts, for sessions analyzed BEFORE auto-sync existed. Never
// exposed in the UI. Non-destructive (upsert-only, preserves user task status). Idempotent — safe
// to re-run. Reports created / updated / skipped / failed.
//
// Run against the emulator or a project with admin credentials, from firebase/functions:
//   npm run build && node lib/scripts/backfill-tasks.js --run
// Without --run it does a dry count only and writes nothing.
import "dotenv/config";
import { db } from "../admin";
import { normalizeReview } from "../reviewSchema";
import { syncSessionTasks } from "../sessionArtifacts";

async function main() {
  const commit = process.argv.includes("--run");
  const reviews = await db.collection("session_reviews").get();
  console.log(`backfill-tasks: found ${reviews.size} session review(s). ${commit ? "COMMITTING" : "DRY RUN (pass --run to write)"}.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let sessionsTouched = 0;

  for (const reviewDoc of reviews.docs) {
    const sessionId = (reviewDoc.data().session_id as string | undefined) || reviewDoc.id;
    try {
      const sessionSnap = await db.doc(`sessions/${sessionId}`).get();
      if (!sessionSnap.exists) {
        skipped++;
        continue;
      }
      const workspaceId = sessionSnap.data()?.workspace_id as string | undefined;
      if (!workspaceId) {
        skipped++;
        continue;
      }
      const review = normalizeReview(reviewDoc.data());
      const sessionTitle = (sessionSnap.data()?.title as string | undefined)?.trim() || "Untitled session";
      const projectId = (sessionSnap.data()?.project_id as string | undefined) ?? null;

      if (!commit) {
        created += review.tasks.filter((t) => t.title.trim()).length;
        sessionsTouched++;
        continue;
      }

      const res = await syncSessionTasks({ sessionId, workspaceId, sessionTitle, projectId, review });
      created += res.created;
      updated += res.updated;
      skipped += res.skipped;
      await db.doc(`sessions/${sessionId}`).update({
        review_summary: review.executive_summary,
        tasks_count: review.tasks.length,
        decisions_count: review.decisions.length,
      });
      sessionsTouched++;
    } catch (err) {
      failed++;
      console.error(`  session ${sessionId}: FAILED —`, err instanceof Error ? err.message : err);
    }
  }

  console.log("backfill-tasks: report");
  console.log(`  sessions processed: ${sessionsTouched}`);
  console.log(`  tasks created:      ${created}${commit ? "" : " (estimated)"}`);
  console.log(`  tasks updated:      ${updated}`);
  console.log(`  skipped:            ${skipped}`);
  console.log(`  failed:             ${failed}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
