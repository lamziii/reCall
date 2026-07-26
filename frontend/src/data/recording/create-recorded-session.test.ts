import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRecordedSession } from './create-recorded-session'
import { generateSampleWorkspace } from '../sample/generate-sample-workspace'
import { deleteWorkspaceData, getWorkspaceData, saveWorkspaceData } from '../workspace-repository'

vi.mock('./audio-storage-service', () => ({
  saveRecordingAudio: vi.fn().mockResolvedValue(undefined),
}))

describe('createRecordedSession', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('persists a new session with the live transcript and marks it as a live recording', async () => {
    const before = getWorkspaceData()!.sessions.length

    const sessionId = await createRecordedSession({
      title: 'Weekly Sync',
      language: 'en-US',
      durationSeconds: 125,
      segments: [{ id: 'seg-1', text: 'Let’s ship it.', offsetSeconds: 12 }],
      audioBlob: new Blob(['audio'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
    })

    const data = getWorkspaceData()!
    expect(data.sessions.length).toBe(before + 1)

    const session = data.sessions.find((s) => s.id === sessionId)!
    expect(session.title).toBe('Weekly Sync')
    expect(session.source).toBe('live-recording')
    expect(session.durationMinutes).toBe(2)
    expect(session.transcript?.[0].text).toBe('Let’s ship it.')
    expect(session.audio).toEqual({ mimeType: 'audio/webm', durationSeconds: 125 })
  })

  it('falls back to "Untitled session" when no title is given', async () => {
    const sessionId = await createRecordedSession({
      title: '   ',
      language: 'en-US',
      durationSeconds: 30,
      segments: [],
      audioBlob: null,
      mimeType: 'audio/webm',
    })

    const session = getWorkspaceData()!.sessions.find((s) => s.id === sessionId)!
    expect(session.title).toBe('Untitled session')
    expect(session.audio).toBeUndefined()
  })
})
