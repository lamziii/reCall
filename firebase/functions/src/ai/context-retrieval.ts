// Retrieval layer for Recall AI (SERVER-ONLY). Given the authenticated user's workspace and the
// entity they're currently viewing, assembles a bounded, trimmed context package from Firestore —
// never the whole database. Every query is scoped to `workspace_id == workspaceId` (membership is
// verified by the caller), so one workspace's data can never leak into another's.
//
// This is a deliberately simple keyword-free selector: recent sessions + open tasks + projects,
// plus the focused entity's full detail. The signature (getAIContext) is stable so a semantic /
// vector retriever can replace the body later without touching the callers.
import type { Firestore } from "firebase-admin/firestore";

export interface ContextEntity {
  type: "session" | "project" | "task" | "person" | "decision";
  id: string;
  title: string;
}

export interface CurrentEntity {
  type?: string | null;
  id?: string | null;
}

export interface AIContextResult {
  text: string;
  entities: ContextEntity[];
}

const MAX_SESSIONS = 12;
const MAX_TASKS = 25;
const MAX_PROJECTS = 10;
const TRANSCRIPT_EXCERPT_CHARS = 6000;

const PRIORITY_LABEL: Record<string, string> = { red: "high", amber: "normal", gray: "low" };
const STATUS_LABEL: Record<string, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

function toDate(ts: any): string | null {
  try {
    if (ts?.toDate) return ts.toDate().toISOString().slice(0, 10);
  } catch {
    /* ignore */
  }
  return null;
}

/** Fetch up to `limit` docs for a workspace with no orderBy — avoids composite-index requirements;
 *  we sort in memory. Fine for the bounded sizes we read here. */
async function fetchByWorkspace(db: Firestore, collection: string, workspaceId: string, limit: number): Promise<Record<string, any>[]> {
  const snap = await db.collection(collection).where("workspace_id", "==", workspaceId).limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, any>);
}

function byCreatedDesc(a: any, b: any): number {
  const at = a.created_at?.toMillis?.() ?? 0;
  const bt = b.created_at?.toMillis?.() ?? 0;
  return bt - at;
}

export async function getAIContext(db: Firestore, workspaceId: string, current?: CurrentEntity | null): Promise<AIContextResult> {
  const entities: ContextEntity[] = [];
  const sections: string[] = [];

  // --- Focused entity: full detail for what the user is looking at right now ---
  if (current?.id && current.type === "session") {
    const focus = await buildSessionDetail(db, workspaceId, current.id, entities);
    if (focus) sections.push(focus);
  } else if (current?.id && current.type === "project") {
    const focus = await buildProjectDetail(db, workspaceId, current.id, entities);
    if (focus) sections.push(focus);
  }

  // --- Recent sessions (summaries only — never full transcripts here) ---
  const sessions = (await fetchByWorkspace(db, "sessions", workspaceId, 40)).sort(byCreatedDesc).slice(0, MAX_SESSIONS);
  if (sessions.length) {
    const lines = sessions.map((s) => {
      addEntity(entities, { type: "session", id: s.id, title: s.title || "Untitled session" });
      const date = toDate(s.created_at);
      const parts = [
        `- ${s.title || "Untitled session"}${date ? ` (${date})` : ""}`,
        s.participants?.length ? `participants: ${s.participants.slice(0, 8).join(", ")}` : "",
        s.review_summary ? `summary: ${truncate(s.review_summary, 300)}` : "",
      ].filter(Boolean);
      return parts.join(" — ");
    });
    sections.push(`Recent meetings:\n${lines.join("\n")}`);
  }

  // --- Open tasks ---
  const tasks = (await fetchByWorkspace(db, "tasks", workspaceId, 60))
    .filter((t) => t.status !== "done")
    .sort(byCreatedDesc)
    .slice(0, MAX_TASKS);
  if (tasks.length) {
    const lines = tasks.map((t) => {
      addEntity(entities, { type: "task", id: t.id, title: t.title || "Untitled task" });
      const bits = [
        `- ${t.title || "Untitled task"}`,
        t.owner ? `owner: ${t.owner}` : "owner: unassigned",
        t.deadline ? `due: ${t.deadline}` : "",
        t.priority ? `priority: ${PRIORITY_LABEL[t.priority] ?? t.priority}` : "",
        t.status ? `status: ${STATUS_LABEL[t.status] ?? t.status}` : "",
        t.source_session_title ? `from: ${t.source_session_title}` : "",
      ].filter(Boolean);
      return bits.join(" · ");
    });
    sections.push(`Open tasks:\n${lines.join("\n")}`);
  }

  // --- Projects ---
  const projects = (await fetchByWorkspace(db, "projects", workspaceId, MAX_PROJECTS)).sort(byCreatedDesc);
  if (projects.length) {
    const lines = projects.map((p) => {
      addEntity(entities, { type: "project", id: p.id, title: p.name || "Untitled project" });
      const bits = [
        `- ${p.name || "Untitled project"}`,
        p.status ? `status: ${p.status}` : "",
        p.description ? truncate(p.description, 160) : "",
      ].filter(Boolean);
      return bits.join(" — ");
    });
    sections.push(`Projects:\n${lines.join("\n")}`);
  }

  return { text: sections.join("\n\n"), entities };
}

async function buildSessionDetail(db: Firestore, workspaceId: string, sessionId: string, entities: ContextEntity[]): Promise<string | null> {
  const doc = await db.doc(`sessions/${sessionId}`).get();
  const s = doc.data() as Record<string, any> | undefined;
  if (!s || s.workspace_id !== workspaceId) return null; // authorization: session must belong to this workspace

  addEntity(entities, { type: "session", id: sessionId, title: s.title || "This meeting" });
  const out: string[] = [`The user is currently viewing this meeting: "${s.title || "Untitled"}"${toDate(s.created_at) ? ` (${toDate(s.created_at)})` : ""}.`];
  if (s.participants?.length) out.push(`Participants: ${s.participants.slice(0, 12).join(", ")}.`);

  const review = (await db.doc(`session_reviews/${sessionId}`).get()).data() as Record<string, any> | undefined;
  if (review) {
    if (review.executive_summary) out.push(`Summary: ${review.executive_summary}`);
    if (review.decisions?.length) {
      out.push(`Decisions:\n${review.decisions.slice(0, 12).map((d: any) => `- ${d.decision}${d.details ? ` — ${truncate(d.details, 200)}` : ""}`).join("\n")}`);
    }
    if (review.tasks?.length) {
      out.push(`Action items:\n${review.tasks.slice(0, 15).map((t: any) => `- ${t.title}${t.owner ? ` (owner: ${t.owner})` : ""}${t.deadline ? ` (due ${t.deadline})` : ""}`).join("\n")}`);
    }
    if (review.questions?.length) {
      out.push(`Open questions:\n${review.questions.slice(0, 10).map((q: any) => `- ${q.question}`).join("\n")}`);
    }
    if (review.risks?.length) {
      out.push(`Risks:\n${review.risks.slice(0, 8).map((r: any) => `- ${r.risk}`).join("\n")}`);
    }
  }
  // Only include a transcript excerpt when there's no review to summarize — keeps context small.
  if (!review?.executive_summary && typeof s.transcript === "string" && s.transcript.trim()) {
    out.push(`Transcript excerpt:\n${truncate(s.transcript, TRANSCRIPT_EXCERPT_CHARS)}`);
  }
  return out.join("\n\n");
}

async function buildProjectDetail(db: Firestore, workspaceId: string, projectId: string, entities: ContextEntity[]): Promise<string | null> {
  const doc = await db.doc(`projects/${projectId}`).get();
  const p = doc.data() as Record<string, any> | undefined;
  if (!p || p.workspace_id !== workspaceId) return null;

  addEntity(entities, { type: "project", id: projectId, title: p.name || "This project" });
  const out: string[] = [`The user is currently viewing this project: "${p.name || "Untitled"}".`];
  if (p.description) out.push(`Description: ${truncate(p.description, 400)}`);

  // Single-equality queries (no composite index needed); re-filter to the workspace in memory.
  const sessions = (await db.collection("sessions").where("project_id", "==", projectId).limit(20).get()).docs
    .map((d) => d.data() as any)
    .filter((s) => s.workspace_id === workspaceId)
    .slice(0, 15);
  if (sessions.length) {
    out.push(`Meetings in this project:\n${sessions.map((s) => `- ${s.title || "Untitled"}`).join("\n")}`);
  }
  const tasks = (await db.collection("tasks").where("project_id", "==", projectId).limit(40).get()).docs
    .map((d) => d.data() as any)
    .filter((t) => t.workspace_id === workspaceId);
  const open = tasks.filter((t) => t.status !== "done");
  if (open.length) {
    out.push(`Open tasks in this project:\n${open.slice(0, 20).map((t) => `- ${t.title}${t.owner ? ` (owner: ${t.owner})` : ""}`).join("\n")}`);
  }
  return out.join("\n\n");
}

function addEntity(list: ContextEntity[], e: ContextEntity) {
  if (!list.some((x) => x.type === e.type && x.id === e.id)) list.push(e);
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
