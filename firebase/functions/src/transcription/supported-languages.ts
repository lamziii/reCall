// The single source of truth for the languages Recall officially supports for transcription.
// Do NOT hardcode language codes elsewhere — import from here.
//
// WHAT RELIES ON OPENAI vs WHAT IS LOCAL:
//   OpenAI's POST /v1/audio/transcriptions accepts only ONE `language` hint (a single ISO-639-1
//   code) plus a free-text `prompt`. There is NO "list of expected languages" parameter. So this
//   list drives two things:
//     1. pickLanguageHint() chooses the ONE supported code we send OpenAI (Albanian first on ties).
//     2. The local post-transcription pass (language-metrics.ts) does the real four-language
//        prioritization — biasing ambiguous recognition toward these four, Albanian above the rest.
//
// Order matters: earlier = higher priority when recognition is ambiguous. Priority 1 (sq, en)
// before Priority 2 (de, fr).
export const SUPPORTED_TRANSCRIPTION_LANGUAGES = ["sq", "en", "de", "fr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_TRANSCRIPTION_LANGUAGES)[number];

/** Priority tiers. Primary (Albanian, English) win when audio is ambiguous; secondary (German,
 *  French) are fully supported and preserved when clearly spoken, but don't win ambiguous ties. */
export const PRIMARY_LANGUAGES: readonly SupportedLanguage[] = ["sq", "en"];
export const SECONDARY_LANGUAGES: readonly SupportedLanguage[] = ["de", "fr"];

/** Preferred whenever recognition is ambiguous — the tie-break winner and the no-hint default. */
export const PRIMARY_LANGUAGE: SupportedLanguage = "sq";

/** The default "expected meeting languages" a session gets when the user hasn't chosen. */
export const DEFAULT_EXPECTED_LANGUAGES: readonly SupportedLanguage[] = ["sq", "en"];

/** Human-readable names for the compact selector + prompts. */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = { sq: "Albanian", en: "English", de: "German", fr: "French" };

/**
 * Normalizes an arbitrary expected-languages value (from the session doc / client) to a clean,
 * ordered, supported subset. Falls back to the default when nothing usable is present. These are
 * SOFT hints — they never restrict recognition to the subset.
 */
export function parseExpectedLanguages(raw: unknown): SupportedLanguage[] {
  const arr = Array.isArray(raw) ? raw : [];
  const set = new Set(arr.map(normalizeLang).filter(isSupportedLanguage));
  const ordered = SUPPORTED_TRANSCRIPTION_LANGUAGES.filter((l) => set.has(l));
  return ordered.length ? ordered : [...DEFAULT_EXPECTED_LANGUAGES];
}

/** Above this fraction of unsupported-language words, language-metrics.ts logs a dev warning. */
export const UNSUPPORTED_LANGUAGE_WARN_THRESHOLD =
  Number(process.env.TRANSCRIPTION_UNSUPPORTED_WARN_THRESHOLD) || 0.05;

/** "en-US" / " SQ " → "en" / "sq". Returns "" for empty/nullish. */
export function normalizeLang(code: string | undefined | null): string {
  return (code ?? "").trim().toLowerCase().split(/[-_]/)[0];
}

export function isSupportedLanguage(code: string | undefined | null): code is SupportedLanguage {
  return (SUPPORTED_TRANSCRIPTION_LANGUAGES as readonly string[]).includes(normalizeLang(code));
}

/**
 * Picks the ONE language hint to send OpenAI from every hint Recall knows (user language,
 * workspace languages, meeting languages). Keeps only supported codes, then returns the
 * highest-priority one per SUPPORTED_TRANSCRIPTION_LANGUAGES order — so Albanian wins ties.
 * Returns undefined when no hint is supported; the caller decides the fallback (PRIMARY_LANGUAGE).
 */
export function pickLanguageHint(hints: Array<string | undefined | null>): SupportedLanguage | undefined {
  const supported = new Set(hints.map(normalizeLang).filter(isSupportedLanguage));
  return SUPPORTED_TRANSCRIPTION_LANGUAGES.find((l) => supported.has(l));
}

/** ponytail: one runnable self-check — `node lib/transcription/supported-languages.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  assert.equal(normalizeLang("en-US"), "en");
  assert.equal(isSupportedLanguage("SQ"), true);
  assert.equal(isSupportedLanguage("es"), false);
  // Albanian wins ties regardless of hint order.
  assert.equal(pickLanguageHint(["en", "sq"]), "sq");
  assert.equal(pickLanguageHint(["de-DE", "fr"]), "de", "de outranks fr");
  assert.equal(pickLanguageHint(["es", "it"]), undefined, "no supported hint");
  assert.deepEqual(parseExpectedLanguages(["en", "sq", "es"]), ["sq", "en"], "ordered supported subset, drops es");
  assert.deepEqual(parseExpectedLanguages([]), ["sq", "en"], "empty → default");
  assert.deepEqual(parseExpectedLanguages(["de"]), ["de"], "secondary alone is allowed");
  console.log("supported-languages self-check passed");
}
