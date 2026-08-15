import type { SessionSpeaker, TranscriptSegment } from './types'
import type { FinalizedSegment } from '@/data/recording/recording-types'

/**
 * Speaker + transcript helpers (pure). The browser Web Speech API does NOT diarize, so every
 * finalized segment is attributed to a single generic "Speaker 1" today. Manual speaker mapping
 * (Speaker N → a real name) and, later, a server diarization provider will produce real turns.
 */

const DEFAULT_SPEAKER_ID = 's1'
const DEFAULT_SPEAKER_LABEL = 'Speaker 1'

/** Converts browser Web Speech finalized segments into transcript segments (single speaker). */
export function finalizedToSegments(finalized: FinalizedSegment[]): TranscriptSegment[] {
  return finalized
    .filter((s) => s.text.trim().length > 0)
    .map((s, i) => ({
      id: s.id || `seg-${i}`,
      speakerId: DEFAULT_SPEAKER_ID,
      speakerLabel: DEFAULT_SPEAKER_LABEL,
      startMs: Math.max(0, Math.round(s.offsetSeconds * 1000)),
      endMs: Math.max(0, Math.round(s.offsetSeconds * 1000)),
      text: s.text.trim(),
    }))
}

/** Derives the default speaker roster from segments — one generic entry per distinct label. */
export function defaultSpeakers(segments: TranscriptSegment[]): SessionSpeaker[] {
  const seen = new Map<string, SessionSpeaker>()
  for (const seg of segments) {
    if (!seen.has(seg.speakerLabel)) {
      seen.set(seg.speakerLabel, { id: seg.speakerId, label: seg.speakerLabel, displayName: null })
    }
  }
  return [...seen.values()]
}

/** Resolves a segment's display label using the mapping; falls back to the generic label. */
function resolveLabel(seg: TranscriptSegment, byLabel: Map<string, SessionSpeaker>): string {
  const s = byLabel.get(seg.speakerLabel)
  return s?.displayName?.trim() || seg.speakerLabel || 'Speaker'
}

/**
 * Builds a "Name: text" transcript from segments, merging consecutive same-speaker turns.
 * Mirrors the server's buildLabeledTranscript so the on-screen transcript matches what Claude
 * analyzed. With no segments, returns the plain transcript.
 */
export function segmentsToText(
  segments: TranscriptSegment[],
  speakers?: SessionSpeaker[],
  plain = '',
): string {
  if (segments.length === 0) return plain.trim()
  const byLabel = new Map((speakers ?? []).map((s) => [s.label, s]))
  const lines: string[] = []
  let currentLabel: string | null = null
  let buffer: string[] = []
  const flush = () => {
    if (currentLabel !== null && buffer.length > 0) lines.push(`${currentLabel}: ${buffer.join(' ').trim()}`)
    buffer = []
  }
  for (const seg of segments) {
    const text = seg.text?.trim()
    if (!text) continue
    const label = resolveLabel(seg, byLabel)
    if (label !== currentLabel) {
      flush()
      currentLabel = label
    }
    buffer.push(text)
  }
  flush()
  return lines.join('\n').trim() || plain.trim()
}
