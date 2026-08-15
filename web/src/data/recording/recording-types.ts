export type RecordingStatus = 'idle' | 'requesting-permission' | 'recording' | 'paused' | 'stopping' | 'stopped' | 'error'

export interface RecordingSetupValues {
  title: string
  projectId: string
  language: string
  notes: string
}

export interface AudioRecorderResult {
  blob: Blob
  mimeType: string
  durationSeconds: number
}

export interface FinalizedSegment {
  id: string
  text: string
  offsetSeconds: number
}
