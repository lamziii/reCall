// Strict, machine-readable Session Review shape produced by the AI extraction step.
// This is the element-shape contract Person B owns (see docs/CONTRACTS.md Contract 1):
// the frontend reads exactly these fields. Keep in sync with
// frontend/src/data/live/review-mappers.ts.

export type Priority = "red" | "amber" | "gray";
export type Severity = "low" | "medium" | "high";

export interface DiscussionTopic {
  title: string;
  summary: string;
}
export interface ReviewDecision {
  decision: string;
  details: string;
  evidence: string | null;
}
// AI-extracted candidate task — NOT a board task (no id/status workflow). Promoting one
// into the `tasks` collection is a separate, explicit step (see Contract 2).
export interface CandidateTask {
  title: string;
  owner: string | null;
  deadline: string | null; // YYYY-MM-DD or null — never a "No deadline" string
  priority: Priority;
  evidence: string | null;
}
export interface TimelineItem {
  label: string;
  detail: string | null;
}
export interface ReviewRisk {
  risk: string;
  severity: Severity;
  evidence: string | null;
}
export interface ReviewQuestion {
  question: string;
  context: string | null;
}

export interface SessionReview {
  executive_summary: string;
  discussion_topics: DiscussionTopic[];
  decisions: ReviewDecision[];
  tasks: CandidateTask[];
  timeline: TimelineItem[];
  insights: string[];
  risks: ReviewRisk[];
  questions: ReviewQuestion[];
}

// JSON Schema for Anthropic Structured Outputs (output_config.format). Kept within the
// documented structured-output subset: every object sets additionalProperties:false and
// lists all properties in `required`; optional scalars use ["string","null"] unions rather
// than length/format constraints (which structured outputs does not support).
export const REVIEW_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    executive_summary: { type: "string" },
    discussion_topics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { title: { type: "string" }, summary: { type: "string" } },
        required: ["title", "summary"],
      },
    },
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          decision: { type: "string" },
          details: { type: "string" },
          evidence: { type: ["string", "null"] },
        },
        required: ["decision", "details", "evidence"],
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          owner: { type: ["string", "null"] },
          deadline: { type: ["string", "null"] },
          priority: { type: "string", enum: ["red", "amber", "gray"] },
          evidence: { type: ["string", "null"] },
        },
        required: ["title", "owner", "deadline", "priority", "evidence"],
      },
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { label: { type: "string" }, detail: { type: ["string", "null"] } },
        required: ["label", "detail"],
      },
    },
    insights: { type: "array", items: { type: "string" } },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          risk: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          evidence: { type: ["string", "null"] },
        },
        required: ["risk", "severity", "evidence"],
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { question: { type: "string" }, context: { type: ["string", "null"] } },
        required: ["question", "context"],
      },
    },
  },
  required: [
    "executive_summary",
    "discussion_topics",
    "decisions",
    "tasks",
    "timeline",
    "insights",
    "risks",
    "questions",
  ],
} as const;

// ---- Defensive normalization -------------------------------------------------
// Structured outputs makes malformed JSON unlikely, but we never trust model output
// blindly: coerce every field to its contract type with an explicit safe default, so a
// partial or surprising response can't break the UI or persist a half-shaped review.

const PRIORITIES: Priority[] = ["red", "amber", "gray"];
const SEVERITIES: Severity[] = ["low", "medium", "high"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function nullableStr(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function normalizeDeadline(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  // Only accept a real ISO date; the model must not fabricate a deadline, and "No deadline"
  // or free text must never reach the wire (Contract 2 rule).
  return ISO_DATE.test(s) ? s : null;
}

export function normalizeReview(raw: unknown): SessionReview {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    executive_summary: str(r.executive_summary),
    discussion_topics: arr(r.discussion_topics).map((t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      return { title: str(o.title), summary: str(o.summary) };
    }),
    decisions: arr(r.decisions).map((d) => {
      const o = (d ?? {}) as Record<string, unknown>;
      return { decision: str(o.decision), details: str(o.details), evidence: nullableStr(o.evidence) };
    }),
    tasks: arr(r.tasks).map((t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      const priority = PRIORITIES.includes(o.priority as Priority) ? (o.priority as Priority) : "gray";
      return {
        title: str(o.title),
        owner: nullableStr(o.owner), // frontend renders null owner as "Unassigned"
        deadline: normalizeDeadline(o.deadline),
        priority,
        evidence: nullableStr(o.evidence),
      };
    }).filter((t) => t.title.length > 0),
    timeline: arr(r.timeline).map((t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      return { label: str(o.label), detail: nullableStr(o.detail) };
    }),
    insights: arr(r.insights).map(str).filter((s) => s.length > 0),
    risks: arr(r.risks).map((r2) => {
      const o = (r2 ?? {}) as Record<string, unknown>;
      const severity = SEVERITIES.includes(o.severity as Severity) ? (o.severity as Severity) : "medium";
      return { risk: str(o.risk), severity, evidence: nullableStr(o.evidence) };
    }),
    questions: arr(r.questions).map((q) => {
      const o = (q ?? {}) as Record<string, unknown>;
      return { question: str(o.question), context: nullableStr(o.context) };
    }),
  };
}

// ponytail: one runnable self-check instead of a full test suite — `node lib/reviewSchema.js`.
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  const out = normalizeReview({
    executive_summary: "ok",
    tasks: [
      { title: "Do X", owner: "  ", deadline: "No deadline", priority: "bogus", evidence: null },
      { title: "", owner: "Sam", deadline: "2026-08-10", priority: "red", evidence: "line 4" },
    ],
    insights: ["a", 3, ""],
    risks: [{ risk: "slip", severity: "extreme", evidence: null }],
  });
  assert.equal(out.tasks.length, 1, "empty-title task dropped");
  assert.equal(out.tasks[0].owner, null, "blank owner -> null");
  assert.equal(out.tasks[0].deadline, null, "'No deadline' -> null");
  assert.equal(out.tasks[0].priority, "gray", "bad priority -> gray");
  assert.deepEqual(out.insights, ["a"], "non-string/empty insights dropped");
  assert.equal(out.risks[0].severity, "medium", "bad severity -> medium");
  assert.deepEqual(out.discussion_topics, [], "missing array -> []");
  console.log("reviewSchema self-check passed");
}
