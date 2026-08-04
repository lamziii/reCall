// Input validation at the trust boundary — runs before any provider (or API key) is touched.
// Limits are env-overridable so ops can tune them without a code change.

const MB = 1024 * 1024;
export const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES) || 25 * MB;
export const MAX_DURATION_SECONDS = Number(process.env.MAX_AUDIO_DURATION_SECONDS) || 90 * 60; // 90 min

// Container/codec families the providers accept. We match on a prefix so parameters like
// `audio/webm;codecs=opus` still pass.
const ALLOWED_MIME_PREFIXES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/m4a", "audio/aac", "audio/flac"];

export interface AudioValidationInput {
  byteLength: number;
  mimeType: string;
  durationSeconds?: number;
}

/** Returns a user-safe error message, or null when the audio is acceptable. */
export function validateAudio({ byteLength, mimeType, durationSeconds }: AudioValidationInput): string | null {
  if (!byteLength) return "Request body must be the audio bytes.";
  if (byteLength > MAX_AUDIO_BYTES) return `Recording is too large — keep it under ${Math.round(MAX_AUDIO_BYTES / MB)}MB.`;
  const mime = (mimeType || "").toLowerCase().split(";")[0].trim();
  if (!ALLOWED_MIME_PREFIXES.some((p) => mime === p || mime.startsWith(p))) {
    return `Unsupported audio type "${mime || "unknown"}". Use webm, ogg, mp4/m4a, mp3, wav, or flac.`;
  }
  if (durationSeconds != null && durationSeconds > MAX_DURATION_SECONDS) {
    return `Recording is too long — keep it under ${Math.round(MAX_DURATION_SECONDS / 60)} minutes.`;
  }
  return null;
}
