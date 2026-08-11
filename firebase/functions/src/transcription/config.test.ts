// Tests for the long-recording pipeline config helpers: byte-aware chunk sizing and controlled
// concurrency (order preservation + bounded parallelism). No audio, no network.
// Run: `node lib/transcription/config.test.js` (via npm run test:transcription).
import assert from "node:assert";
import { chunkSecondsForByteCap, mapWithConcurrency } from "./config";

const TARGET = 1200; // 20min
const MAX_BYTES = 24 * 1024 * 1024;
const MIN = 60;

async function run() {
  // --- chunkSecondsForByteCap: how many chunks a recording becomes ---
  // Speech-bitrate Opus ~32kbps = 4000 bytes/sec. Every duration stays at the time target because
  // a 20min chunk (~4.8MB) is far under the 24MB byte cap.
  const bps32 = 4000;
  const chunkCount = (durationSec: number, chunkSec: number) => Math.ceil(durationSec / chunkSec);

  let sec = chunkSecondsForByteCap(30 * 60 * bps32, 30 * 60, TARGET, MAX_BYTES, MIN);
  assert.equal(sec, TARGET, "30min @32kbps: full 20min chunks");
  assert.equal(chunkCount(30 * 60, sec), 2, "30min → 2 chunks");

  sec = chunkSecondsForByteCap(60 * 60 * bps32, 60 * 60, TARGET, MAX_BYTES, MIN);
  assert.equal(chunkCount(60 * 60, sec), 3, "60min → 3 chunks");

  sec = chunkSecondsForByteCap(180 * 60 * bps32, 180 * 60, TARGET, MAX_BYTES, MIN);
  assert.equal(sec, TARGET, "3h @32kbps still 20min chunks (byte-safe)");
  assert.equal(chunkCount(180 * 60, sec), 9, "3h → 9 chunks");

  // --- byte cap dominates when bitrate is high ---
  // 256kbps = 32000 bytes/sec. 24MB*0.95 / 32000 ≈ 712s < 1200s → chunk shrinks to fit the byte cap.
  const bps256 = 32000;
  sec = chunkSecondsForByteCap(60 * 60 * bps256, 60 * 60, TARGET, MAX_BYTES, MIN);
  assert.ok(sec < TARGET, "high bitrate → smaller chunks to respect 24MB");
  assert.ok(sec * bps256 <= MAX_BYTES, "chosen chunk length keeps bytes under the cap");

  // --- unknown duration → fall back to the time target (caller re-splits stragglers) ---
  assert.equal(chunkSecondsForByteCap(999, undefined, TARGET, MAX_BYTES, MIN), TARGET, "no duration → target");
  assert.equal(chunkSecondsForByteCap(0, 100, TARGET, MAX_BYTES, MIN), TARGET, "no bytes → target");

  // --- never below the floor ---
  sec = chunkSecondsForByteCap(60 * 60 * 1_000_000, 60 * 60, TARGET, MAX_BYTES, MIN);
  assert.equal(sec, MIN, "absurd bitrate clamps to the min chunk floor");

  // --- mapWithConcurrency: order preserved, parallelism bounded ---
  let inFlight = 0;
  let maxInFlight = 0;
  const items = [0, 1, 2, 3, 4, 5, 6, 7];
  const out = await mapWithConcurrency(items, 2, async (n) => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return n * 10;
  });
  assert.deepEqual(out, items.map((n) => n * 10), "results keep input order despite concurrency");
  assert.ok(maxInFlight <= 2, `never more than 2 in flight (saw ${maxInFlight})`);

  // --- retry-style resume: a chunk that fails its first attempt doesn't restart the others ---
  const attempts = new Map<number, number>();
  const results = await mapWithConcurrency(items, 3, async (n) => {
    const tries = (attempts.get(n) ?? 0) + 1;
    attempts.set(n, tries);
    if (n === 4 && tries === 1) throw new Error("transient"); // caller would withRetry; simulate one retry
    return n;
  }).catch(() => null);
  // The pool itself doesn't retry (withRetry wraps fn in the provider); assert the failing item is
  // isolated: every OTHER item still ran exactly once.
  assert.equal(results, null, "an unretried throw rejects the batch (provider wraps fn in withRetry)");
  for (const n of items) if (n !== 4) assert.equal(attempts.get(n), 1, `chunk ${n} ran once, not restarted`);

  console.log("config helper tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
