// Shared network guards for provider calls: a hard request timeout (so a hung provider never
// wedges the function) and a small bounded retry for transient failures. Kept tiny on purpose —
// providers pass their own fetch thunk so headers/keys stay local to each provider.

const REQUEST_TIMEOUT_MS = Number(process.env.TRANSCRIPTION_REQUEST_TIMEOUT_MS) || 60_000;

/** Runs a fetch with an AbortController timeout. Throws a clear error on timeout. */
export async function withTimeout(run: (signal: AbortSignal) => Promise<Response>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await run(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) throw new Error(`Provider request timed out after ${timeoutMs}ms.`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Sleep helper (Date.now-free wait via setTimeout). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries `run` up to `attempts` times on thrown errors, with linear backoff. Used for the
 * transient bits of a provider flow (submit/poll). The caller decides what's retryable by throwing.
 */
export async function withRetry<T>(run: () => Promise<T>, attempts = 2, backoffMs = 500): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await run();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(backoffMs * (i + 1));
    }
  }
  throw lastErr;
}
