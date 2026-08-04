import { describe, expect, it } from 'vitest'
import { defaultSpeakers, finalizedToSegments, segmentsToText } from './speakers'
import type { SessionSpeaker, TranscriptSegment } from './types'

const segs: TranscriptSegment[] = [
  { id: '1', speakerId: 's1', speakerLabel: 'Speaker 1', startMs: 0, endMs: 0, text: 'Hi there.' },
  { id: '2', speakerId: 's1', speakerLabel: 'Speaker 1', startMs: 1000, endMs: 0, text: 'Welcome.' },
  { id: '3', speakerId: 's2', speakerLabel: 'Speaker 2', startMs: 2000, endMs: 0, text: 'Thanks.' },
]

describe('defaultSpeakers', () => {
  it('keeps unknown speakers generic with null display names', () => {
    const speakers = defaultSpeakers(segs)
    expect(speakers).toHaveLength(2)
    expect(speakers.map((s) => s.label)).toEqual(['Speaker 1', 'Speaker 2'])
    expect(speakers.every((s) => s.displayName === null)).toBe(true)
  })
})

describe('segmentsToText', () => {
  it('merges consecutive turns and keeps generic labels when unmapped', () => {
    expect(segmentsToText(segs, defaultSpeakers(segs))).toBe('Speaker 1: Hi there. Welcome.\nSpeaker 2: Thanks.')
  })

  it('applies a speaker mapping, replacing labels with names', () => {
    const mapping: SessionSpeaker[] = [
      { id: 's1', label: 'Speaker 1', displayName: 'Uvejs' },
      { id: 's2', label: 'Speaker 2', displayName: 'Investor' },
    ]
    expect(segmentsToText(segs, mapping)).toBe('Uvejs: Hi there. Welcome.\nInvestor: Thanks.')
  })

  it('falls back to plain transcript when there are no segments', () => {
    expect(segmentsToText([], [], 'raw text')).toBe('raw text')
  })
})

describe('finalizedToSegments', () => {
  it('maps browser speech segments to a single generic speaker and drops empties', () => {
    const out = finalizedToSegments([
      { id: 'a', text: 'Hello', offsetSeconds: 2 },
      { id: 'b', text: '   ', offsetSeconds: 3 },
    ])
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ speakerLabel: 'Speaker 1', text: 'Hello', startMs: 2000 })
  })
})
