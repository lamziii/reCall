// Builds the vocabulary bias used by OpenAI (prompt) and the correction layer, from the DEFAULT
// Albanian vocabulary plus real, workspace-scoped proper nouns (project names, participant names,
// mapped speaker names, the workspace/company name). SERVER-ONLY, and strictly scoped to the
// authenticated user's active workspace — vocabulary never leaks between workspaces. We store only
// useful names/terms, never transcript text, deduped and size-capped so token cost stays bounded.
import * as logger from "firebase-functions/logger";
import { db } from "../admin";
import { ALBANIAN_VOCABULARY } from "./albanian-vocabulary";

/** Up to this many dynamic (workspace-derived) terms; defaults are appended after, within TOTAL_LIMIT. */
export const WORKSPACE_TERM_LIMIT = 100;
export const TOTAL_VOCABULARY_LIMIT = 260;
const RECENT_SESSIONS = 20;
const MAX_PROJECTS = 50;
/** Vocabulary shape version — stored on the session so a later change is diagnosable. */
export const VOCABULARY_VERSION = 2;

/** Splits a display name into itself + its individual name tokens (len ≥ 2), so both "Veiz Makulovci"
 *  and "Veiz"/"Makulovci" bias recognition. */
function nameTerms(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const tokens = trimmed.split(/\s+/).filter((t) => t.length >= 2);
  return tokens.length > 1 ? [trimmed, ...tokens] : [trimmed];
}

/**
 * Flattens sources in order, trims, drops empties/very-short tokens, and dedupes case-insensitively
 * while PRESERVING the first-seen capitalization. Order is preserved (earlier = more relevant), then
 * the result is capped at `limit`. Pure — unit-tested.
 */
export function mergeVocabulary(sources: Array<Array<string | null | undefined>>, limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const source of sources) {
    for (const raw of source) {
      const term = (raw ?? "").trim();
      if (term.length < 2) continue;
      const key = term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(term);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

interface SessionLike {
  participants?: unknown;
  project_name?: unknown;
  speakers?: unknown;
}

/** Pulls the useful proper nouns out of a session doc: participant names + mapped speaker names + project. */
function sessionTerms(data: SessionLike): string[] {
  const terms: string[] = [];
  if (Array.isArray(data.participants)) for (const p of data.participants) if (typeof p === "string") terms.push(...nameTerms(p));
  if (typeof data.project_name === "string") terms.push(data.project_name);
  if (Array.isArray(data.speakers)) {
    for (const s of data.speakers) {
      const dn = (s as { displayName?: unknown })?.displayName;
      if (typeof dn === "string" && dn.trim()) terms.push(...nameTerms(dn));
    }
  }
  return terms;
}

/**
 * Assembles the vocabulary for one transcription: current session terms (most relevant) → recent
 * workspace sessions' names → project names → workspace name → default Albanian vocabulary. Best
 * effort: any Firestore read failure degrades to defaults + current session, never throws.
 */
export async function buildWorkspaceVocabulary(params: {
  workspaceId: string;
  workspaceName?: string | null;
  currentSession: SessionLike;
}): Promise<{ vocabulary: string[]; dynamicCount: number }> {
  const { workspaceId, workspaceName, currentSession } = params;
  const current = sessionTerms(currentSession);
  const recent: string[] = [];
  const projects: string[] = [];

  try {
    const snap = await db
      .collection("sessions")
      .where("workspace_id", "==", workspaceId)
      .orderBy("created_at", "desc")
      .limit(RECENT_SESSIONS)
      .get();
    snap.forEach((d) => recent.push(...sessionTerms(d.data() as SessionLike)));
  } catch (err) {
    logger.warn("workspace-vocabulary: recent sessions read failed", { workspace_id: workspaceId, message: err instanceof Error ? err.message : String(err) });
  }

  try {
    const snap = await db.collection("projects").where("workspace_id", "==", workspaceId).limit(MAX_PROJECTS).get();
    snap.forEach((d) => {
      const p = d.data() as Record<string, unknown>;
      for (const key of ["name", "client", "client_name", "code", "product"]) {
        if (typeof p[key] === "string" && (p[key] as string).trim()) projects.push(p[key] as string);
      }
    });
  } catch (err) {
    logger.warn("workspace-vocabulary: projects read failed", { workspace_id: workspaceId, message: err instanceof Error ? err.message : String(err) });
  }

  // Dynamic terms first (capped), then the always-present default Albanian vocabulary.
  const dynamic = mergeVocabulary([current, recent, projects, [workspaceName ?? null]], WORKSPACE_TERM_LIMIT);
  const vocabulary = mergeVocabulary([dynamic, ALBANIAN_VOCABULARY], TOTAL_VOCABULARY_LIMIT);
  return { vocabulary, dynamicCount: dynamic.length };
}

/** ponytail: runnable self-check of the PURE helpers (no Firestore) — `node lib/transcription/workspace-vocabulary.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");

  // Dedup is case-insensitive but preserves first-seen capitalization; order preserved.
  const merged = mergeVocabulary([["Recall", "recall", "Vushtrri"], ["vushtrri", "Prishtinë"]], 100);
  assert.deepEqual(merged, ["Recall", "Vushtrri", "Prishtinë"], "deduped, first capitalization kept");

  // Size limit caps the result.
  const capped = mergeVocabulary([["a1", "b2", "c3", "d4"]], 2);
  assert.equal(capped.length, 2, "limit enforced");

  // Very short tokens dropped.
  assert.deepEqual(mergeVocabulary([["a", "ok", ""]], 10), ["ok"], "tokens shorter than 2 chars dropped");

  // Current-session terms: participant names (full + tokens) + project + mapped speakers.
  const terms = sessionTerms({
    participants: ["Veiz Makulovci"],
    project_name: "Vushtrri",
    speakers: [{ displayName: "Mali" }],
  });
  assert.equal(terms.includes("Veiz Makulovci") && terms.includes("Veiz") && terms.includes("Makulovci"), true, "name split into full + tokens");
  assert.equal(terms.includes("Vushtrri") && terms.includes("Mali"), true, "project + mapped speaker included");
  console.log("workspace-vocabulary self-check passed");
}
