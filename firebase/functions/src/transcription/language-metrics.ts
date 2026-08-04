// LOCAL (no OpenAI) post-transcription pass. Everything here runs on the text AFTER OpenAI returns
// it — OpenAI only ever sees one `language` hint + a vocabulary prompt (see supported-languages.ts).
// This module implements the four-language prioritization Recall needs but the API can't express:
//   • item 4 — flag words that look like an UNSUPPORTED language (Spanish/Italian/…); prefer Albanian.
//   • item 6 — when speech is predominantly Albanian, bias ambiguous spelling toward Albanian.
//   • item 7 — per-transcript language metrics + a dev warning past a configurable threshold.
// It NEVER translates and NEVER invents words. Correction is limited to the known-exonym map in
// albanian-vocabulary.ts (whole-word swaps like Kosovo→Kosovë).
import * as logger from "firebase-functions/logger";
import type { TranscriptSegment } from "./types";
import { ALBANIAN_SPELLING_PREFERENCES } from "./albanian-vocabulary";
import {
  PRIMARY_LANGUAGE,
  SUPPORTED_TRANSCRIPTION_LANGUAGES,
  UNSUPPORTED_LANGUAGE_WARN_THRESHOLD,
  type SupportedLanguage,
} from "./supported-languages";

export interface LanguageMetrics {
  /** The supported language most of the words fall into, or "unknown" for empty text. */
  predominant: SupportedLanguage | "unknown";
  /** Share (0–1) of words per supported language, plus everything that looked non-supported. */
  percentages: Record<SupportedLanguage | "unsupported", number>;
  wordCount: number;
  /** Distinct supported languages that actually appeared (share > 0). */
  detected: SupportedLanguage[];
}

type Bucket = SupportedLanguage | "unsupported" | "ambiguous";

// ponytail: heuristic stopword + diacritic classifier, NOT a real language-ID model — good enough
// to bias toward four known languages and flag obvious foreign words. Swap for cld3/franc if
// per-word accuracy ever needs to be real. The upgrade path is this one function.
const STOPWORDS: Record<SupportedLanguage, Set<string>> = {
  sq: new Set(["dhe", "për", "një", "është", "nuk", "për", "më", "që", "me", "të", "në", "si", "po", "jo", "kjo", "këtu", "faleminderit", "përshëndetje", "mirë", "takim", "detyrë", "projekt"]),
  en: new Set(["the", "and", "is", "are", "to", "of", "in", "for", "with", "this", "that", "we", "you", "meeting", "task", "project", "thanks", "hello", "please", "yes", "no"]),
  de: new Set(["und", "der", "die", "das", "ist", "nicht", "ein", "eine", "mit", "wir", "auch", "haben", "sind", "danke", "hallo", "bitte", "besprechung", "aufgabe", "projekt"]),
  fr: new Set(["et", "le", "la", "les", "est", "une", "un", "avec", "nous", "vous", "pour", "pas", "ce", "cette", "merci", "bonjour", "réunion", "tâche", "projet", "oui"]),
};

// Letters that mark a language. ç/ë also occur in French but are far more common in Albanian, so
// Albanian is checked first (prefer Albanian, item 4).
const UNSUPPORTED_LETTERS = /[ñãõıışğ]/i; // Spanish/Portuguese/Turkish signals
const DE_LETTERS = /[äöüß]/i;
const FR_LETTERS = /[àâæéèêîïôûùœ]/i;
const SQ_LETTERS = /[ëç]/i;

// A handful of unmistakable unsupported-language stopwords — presence flips a word to "unsupported"
// so isolated foreign words show up in the metrics (Spanish/Italian/Portuguese/Turkish).
// Distinctive only — short tokens (e/o/y/ve/il) collide with Albanian/English and are left out.
const UNSUPPORTED_STOPWORDS = new Set(["gracias", "hola", "pero", "muy", "señor", "grazie", "ciao", "sono", "perché", "obrigado", "você", "teşekkür", "merhaba", "için"]);

function classify(word: string): Bucket {
  const w = word.toLowerCase();
  if (SQ_LETTERS.test(w) || STOPWORDS.sq.has(w)) return "sq";
  if (DE_LETTERS.test(w) || STOPWORDS.de.has(w)) return "de";
  if (FR_LETTERS.test(w) || STOPWORDS.fr.has(w)) return "fr";
  if (STOPWORDS.en.has(w)) return "en";
  if (UNSUPPORTED_LETTERS.test(w) || UNSUPPORTED_STOPWORDS.has(w)) return "unsupported";
  return "ambiguous"; // plain ASCII content word or name — resolved to the predominant below
}

function words(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}'’]+/gu) ?? []).filter(Boolean);
}

/**
 * Classifies each word, then attributes ambiguous plain-ASCII words (names, shared tech terms) to
 * the predominant supported language — realizing "when predominantly Albanian, prefer Albanian".
 */
export function analyzeTranscript(text: string): LanguageMetrics {
  const ws = words(text);
  const counts: Record<SupportedLanguage | "unsupported", number> = { sq: 0, en: 0, de: 0, fr: 0, unsupported: 0 };
  let ambiguous = 0;
  for (const w of ws) {
    const b = classify(w);
    if (b === "ambiguous") ambiguous++;
    else counts[b]++;
  }

  // Predominant among the definitely-classified supported words; strictly-greater comparison keeps
  // the earlier (higher-priority) language on ties, and all-zero falls through to PRIMARY (sq).
  let predominant: SupportedLanguage = PRIMARY_LANGUAGE;
  for (const l of SUPPORTED_TRANSCRIPTION_LANGUAGES) if (counts[l] > counts[predominant]) predominant = l;

  // Ambiguous words follow the predominant supported language.
  counts[predominant] += ambiguous;

  const total = ws.length;
  const percentages = { sq: 0, en: 0, de: 0, fr: 0, unsupported: 0 } as Record<SupportedLanguage | "unsupported", number>;
  if (total > 0) for (const k of Object.keys(counts) as Array<keyof typeof counts>) percentages[k] = counts[k] / total;

  const detected = SUPPORTED_TRANSCRIPTION_LANGUAGES.filter((l) => counts[l] > 0);
  return {
    predominant: total === 0 ? "unknown" : predominant,
    percentages,
    wordCount: total,
    detected,
  };
}

// Precompiled whole-word matcher for the exonym map — sorted longest-first so multi-word keys win.
const SPELLING_RE = new RegExp(
  `\\b(${Object.keys(ALBANIAN_SPELLING_PREFERENCES).sort((a, b) => b.length - a.length).join("|")})\\b`,
  "gi",
);

/** item 6: whole-word, case-insensitive swap of known non-Albanian exonyms to the Albanian form. */
export function applyAlbanianSpelling(text: string): string {
  return text.replace(SPELLING_RE, (m) => ALBANIAN_SPELLING_PREFERENCES[m.toLowerCase()] ?? m);
}

/**
 * The one entry point the provider calls. Computes metrics, logs a dev warning when the unsupported
 * share exceeds the threshold (item 7), and — only when predominantly Albanian — rewrites known
 * exonyms in both the text and each segment (item 6). Pure except for the log line.
 */
export function finalizeTranscript(input: {
  text: string;
  segments: TranscriptSegment[];
  logContext?: Record<string, unknown>;
}): { text: string; segments: TranscriptSegment[]; metrics: LanguageMetrics } {
  const metrics = analyzeTranscript(input.text);

  if (metrics.percentages.unsupported > UNSUPPORTED_LANGUAGE_WARN_THRESHOLD) {
    logger.warn("transcription: high unsupported-language share — likely misrecognition", {
      ...input.logContext,
      predominant: metrics.predominant,
      unsupported_pct: Number((metrics.percentages.unsupported * 100).toFixed(1)),
      threshold_pct: UNSUPPORTED_LANGUAGE_WARN_THRESHOLD * 100,
      detected: metrics.detected,
    });
  }

  const correct = metrics.predominant === "sq" ? applyAlbanianSpelling : (s: string) => s;
  return {
    text: correct(input.text),
    segments: input.segments.map((s) => ({ ...s, text: correct(s.text) })),
    metrics,
  };
}
