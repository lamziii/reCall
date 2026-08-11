// Centralized, env-overridable tuning for the long-recording transcription pipeline. Everything the
// chunker/merger/retry logic needs lives here so there are no magic numbers scattered across
// providers. SERVER-ONLY.

const MB = 1024 * 1024;

export const TRANSCRIPTION_CONFIG = {
  /** Target chunk length. OpenAI rejects a single request over ~1400s; 1200s (20min) leaves margin. */
  targetChunkSeconds: Number(process.env.OPENAI_MAX_SEGMENT_SECONDS) || 1200,
  /** Hard per-file byte ceiling for a transcription request. OpenAI caps at 25MB — stay under it. */
  maxFileBytes: Number(process.env.OPENAI_MAX_FILE_BYTES) || 24 * MB,
  /** Floor for byte-driven re-splitting so we never produce absurdly tiny clips. */
  minChunkSeconds: Number(process.env.OPENAI_MIN_SEGMENT_SECONDS) || 60,
  /** Chunks transcribed at once. Small on purpose — respect provider rate limits, avoid bursts. */
  maxConcurrency: Number(process.env.OPENAI_TRANSCRIBE_CONCURRENCY) || 2,
  /** Attempts per chunk before it's considered failed (1 try + retries). */
  maxRetries: Number(process.env.OPENAI_TRANSCRIBE_MAX_RETRIES) || 3,
  /** Base backoff between chunk retries; withRetry multiplies it by the attempt index. */
  retryBackoffMs: Number(process.env.OPENAI_TRANSCRIBE_RETRY_BACKOFF_MS) || 1000,
} as const;

/**
 * Picks a chunk length (seconds) so each ffmpeg segment stays under `maxBytes`, using the recording's
 * measured average bitrate. Returns `targetSeconds` when duration is unknown (caller then verifies
 * actual chunk sizes and re-splits any stragglers). Clamped to `[minSeconds, targetSeconds]`.
 * 5% headroom absorbs per-segment container overhead. Pure — unit-tested.
 */
export function chunkSecondsForByteCap(
  totalBytes: number,
  durationSeconds: number | undefined,
  targetSeconds: number,
  maxBytes: number,
  minSeconds: number,
): number {
  if (!durationSeconds || durationSeconds <= 0 || totalBytes <= 0) return targetSeconds;
  const bytesPerSecond = totalBytes / durationSeconds;
  if (bytesPerSecond <= 0) return targetSeconds;
  const secondsForBytes = Math.floor((maxBytes * 0.95) / bytesPerSecond);
  return Math.max(minSeconds, Math.min(targetSeconds, secondsForBytes));
}

/**
 * Runs `fn` over `items` with at most `limit` in flight, preserving input order in the result array.
 * A shared cursor hands each worker the next index, so a slow chunk never blocks the pool. Used to
 * transcribe audio chunks with controlled parallelism rather than one giant burst of requests.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
