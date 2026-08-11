// Input validation at the trust boundary — runs before any provider (or API key) is touched.
// Limits are env-overridable so ops can tune them without a code change.

const MB = 1024 * 1024;
// Only the INLINE (raw request body) path is byte-capped — a single Cloud Functions HTTP request
// body can't exceed ~32MB, so we reject earlier with a clear message. Longer recordings don't hit
// this: the browser uploads them to Cloud Storage and the function reads them out-of-band
// (skipByteLimit). There is deliberately NO duration cap — the provider chunks internally, so
// meeting length is bounded by storage/cost, not this validator.
export const MAX_INLINE_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES) || 30 * MB;

// Container/codec families the providers accept. We match on a prefix so parameters like
// `audio/webm;codecs=opus` still pass.
const ALLOWED_MIME_PREFIXES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/m4a", "audio/aac", "audio/flac"];

export interface AudioValidationInput {
  byteLength: number;
  mimeType: string;
  durationSeconds?: number;
  /** Set for the Storage path, where the byte cap doesn't apply (that's the whole reason it exists). */
  skipByteLimit?: boolean;
}

/** Returns a user-safe error message, or null when the audio is acceptable. */
export function validateAudio({ byteLength, mimeType, skipByteLimit }: AudioValidationInput): string | null {
  if (!byteLength) return "Request body must be the audio bytes.";
  if (!skipByteLimit && byteLength > MAX_INLINE_AUDIO_BYTES) {
    return `Recording is too large — keep it under ${Math.round(MAX_INLINE_AUDIO_BYTES / MB)}MB.`;
  }
  const mime = (mimeType || "").toLowerCase().split(";")[0].trim();
  if (!ALLOWED_MIME_PREFIXES.some((p) => mime === p || mime.startsWith(p))) {
    return `Unsupported audio type "${mime || "unknown"}". Use webm, ogg, mp4/m4a, mp3, wav, or flac.`;
  }
  return null;
}
