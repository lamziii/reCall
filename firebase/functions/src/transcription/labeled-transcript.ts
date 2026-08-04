import type { SessionSpeaker, TranscriptSegment } from "./types";

// Pure helpers for turning raw segments + a speaker mapping into a speaker-labeled transcript
// string for Claude. No I/O — unit-testable via the self-check at the bottom.

function resolveLabel(segment: TranscriptSegment, byLabel: Map<string, SessionSpeaker>, byId: Map<string, SessionSpeaker>): string {
  const speaker = byLabel.get(segment.speakerLabel) ?? byId.get(segment.speakerId);
  // A mapped display name wins; otherwise fall back to the generic label. Never invent a name.
  return speaker?.displayName?.trim() || segment.speakerLabel || "Speaker";
}

/**
 * Builds a "Name: text" transcript from segments, applying the speaker mapping. Consecutive
 * segments from the same resolved speaker are merged into one line for readability. If there are
 * no segments, returns the plain transcript unchanged.
 */
export function buildLabeledTranscript(
  plainTranscript: string,
  segments: TranscriptSegment[] | undefined,
  speakers: SessionSpeaker[] | undefined,
): string {
  if (!segments || segments.length === 0) return plainTranscript.trim();

  const byLabel = new Map((speakers ?? []).map((s) => [s.label, s]));
  const byId = new Map((speakers ?? []).map((s) => [s.id, s]));

  const lines: string[] = [];
  let currentLabel: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentLabel !== null && buffer.length > 0) {
      lines.push(`${currentLabel}: ${buffer.join(" ").trim()}`);
    }
    buffer = [];
  };

  for (const seg of segments) {
    const text = seg.text?.trim();
    if (!text) continue;
    const label = resolveLabel(seg, byLabel, byId);
    if (label !== currentLabel) {
      flush();
      currentLabel = label;
    }
    buffer.push(text);
  }
  flush();

  const built = lines.join("\n").trim();
  return built || plainTranscript.trim();
}

/** ponytail: one runnable self-check — `node lib/transcription/labeled-transcript.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  const segs: TranscriptSegment[] = [
    { id: "1", speakerId: "s1", speakerLabel: "Speaker 1", startMs: 0, endMs: 1000, text: "Hi there." },
    { id: "2", speakerId: "s1", speakerLabel: "Speaker 1", startMs: 1000, endMs: 2000, text: "Welcome." },
    { id: "3", speakerId: "s2", speakerLabel: "Speaker 2", startMs: 2000, endMs: 3000, text: "Thanks." },
  ];

  // Unknown speakers stay generic.
  assert.equal(
    buildLabeledTranscript("", segs, undefined),
    "Speaker 1: Hi there. Welcome.\nSpeaker 2: Thanks.",
    "generic labels + merge",
  );

  // A mapping replaces the label.
  const speakers: SessionSpeaker[] = [
    { id: "s1", label: "Speaker 1", displayName: "Alex" },
    { id: "s2", label: "Speaker 2", displayName: null },
  ];
  assert.equal(
    buildLabeledTranscript("", segs, speakers),
    "Alex: Hi there. Welcome.\nSpeaker 2: Thanks.",
    "mapped name replaces label; unmapped stays generic",
  );

  // No segments → plain transcript passthrough.
  assert.equal(buildLabeledTranscript("just text", [], speakers), "just text", "empty segments passthrough");
  console.log("labeled-transcript self-check passed");
}
