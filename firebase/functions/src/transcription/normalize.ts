// Pure helpers shared by diarizing providers: turn a flat word stream (word, start, end, speaker)
// into the session pipeline's TranscriptSegment[] + SessionSpeaker[]. No I/O — self-checked below.
import type { SessionSpeaker, TranscriptSegment } from "./types";

export interface Word {
  text: string;
  startSec: number;
  endSec: number;
  speaker?: string; // provider speaker id, e.g. "S1"; undefined when not diarized
  confidence?: number;
  /** True for punctuation — attaches to the previous word without a leading space or new segment. */
  isPunctuation?: boolean;
}

/** "S1" → "Speaker 1"; unknown/blank → "Speaker 1". */
function labelFor(speaker: string | undefined, order: Map<string, number>): { id: string; label: string } {
  const id = speaker && speaker.trim() ? speaker.trim() : "S1";
  if (!order.has(id)) order.set(id, order.size + 1);
  return { id, label: `Speaker ${order.get(id)}` };
}

/**
 * Groups consecutive same-speaker words into segments. Punctuation is glued onto the running text.
 * Returns { segments, speakers } with generic labels — the user maps real names later, exactly
 * like the browser path.
 */
export function wordsToSegments(words: Word[]): { segments: TranscriptSegment[]; speakers: SessionSpeaker[] } {
  const order = new Map<string, number>();
  const segments: TranscriptSegment[] = [];
  let cur: TranscriptSegment | null = null;
  let curSpeaker: string | null = null;

  for (const w of words) {
    const text = w.text?.trim();
    if (!text) continue;
    if (w.isPunctuation) {
      if (cur) cur.text += text; // no leading space before punctuation
      continue;
    }
    const { id, label } = labelFor(w.speaker, order);
    if (!cur || id !== curSpeaker) {
      if (cur) segments.push(cur);
      cur = { id: String(segments.length + 1), speakerId: id, speakerLabel: label, startMs: Math.round(w.startSec * 1000), endMs: Math.round(w.endSec * 1000), text };
      curSpeaker = id;
    } else {
      cur.text += ` ${text}`;
      cur.endMs = Math.round(w.endSec * 1000);
    }
  }
  if (cur) segments.push(cur);

  const speakers: SessionSpeaker[] = [...order.entries()].map(([id, n]) => ({
    id,
    label: `Speaker ${n}`,
    displayName: null,
  }));
  return { segments, speakers };
}

export interface DiarizedTurn {
  speaker?: string; // raw provider label, e.g. "A"/"B"; undefined → single speaker
  text: string;
  startSec: number;
  endSec: number;
}

/**
 * Maps already-segmented diarized turns (OpenAI diarized_json) to the session's TranscriptSegment[]
 * + SessionSpeaker[], assigning generic "Speaker N" labels in first-appearance order — same
 * convention as wordsToSegments so both providers render identically. The user maps real names later.
 */
export function diarizedToSegments(turns: DiarizedTurn[]): { segments: TranscriptSegment[]; speakers: SessionSpeaker[] } {
  const order = new Map<string, number>();
  const segments: TranscriptSegment[] = [];
  for (const t of turns) {
    const text = t.text?.trim();
    if (!text) continue;
    const { id, label } = labelFor(t.speaker, order);
    segments.push({
      id: String(segments.length + 1),
      speakerId: id,
      speakerLabel: label,
      startMs: Math.round(t.startSec * 1000),
      endMs: Math.round(t.endSec * 1000),
      text,
    });
  }
  const speakers: SessionSpeaker[] = [...order.entries()].map(([id, n]) => ({ id, label: `Speaker ${n}`, displayName: null }));
  return { segments, speakers };
}

/** ponytail: one runnable self-check — `node lib/transcription/normalize.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  const { segments, speakers } = wordsToSegments([
    { text: "Përshëndetje", startSec: 0, endSec: 0.5, speaker: "S1" },
    { text: "Ardit", startSec: 0.5, endSec: 1, speaker: "S1" },
    { text: ".", startSec: 1, endSec: 1, speaker: "S1", isPunctuation: true },
    { text: "Faleminderit", startSec: 1.2, endSec: 1.8, speaker: "S2" },
  ]);
  assert.equal(segments.length, 2, "two speaker turns");
  assert.equal(segments[0].text, "Përshëndetje Ardit.", "words joined + punctuation glued");
  assert.equal(segments[0].speakerLabel, "Speaker 1");
  assert.equal(segments[1].speakerLabel, "Speaker 2");
  assert.equal(segments[1].endMs, 1800, "endMs from last word");
  assert.equal(speakers.length, 2, "two distinct speakers");

  // diarizedToSegments: OpenAI-style turns → generic labels in first-appearance order.
  const d = diarizedToSegments([
    { speaker: "A", text: "Mirë se erdhët.", startSec: 0, endSec: 2 },
    { speaker: "B", text: "Faleminderit.", startSec: 2, endSec: 3 },
    { speaker: "A", text: "Si jeni?", startSec: 3, endSec: 4 },
  ]);
  assert.equal(d.segments.length, 3, "one segment per turn");
  assert.equal(d.segments[0].speakerLabel, "Speaker 1");
  assert.equal(d.segments[1].speakerLabel, "Speaker 2");
  assert.equal(d.segments[2].speakerLabel, "Speaker 1", "speaker A stays Speaker 1");
  assert.equal(d.segments[0].endMs, 2000, "ms timestamps");
  assert.equal(d.speakers.length, 2, "two diarized speakers");
  console.log("normalize self-check passed");
}
