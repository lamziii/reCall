// DEV-only pipeline diagnostics. Makes the record → upload → OpenAI → Firestore → Claude flow
// visible in the browser console so it's obvious where the pipeline breaks. No-ops in production,
// and never logs audio, tokens, or keys — stage names + ids + sizes only.

const ORDER = [
  'record.stop',
  'audio.saved',
  'transcription.trigger',
  'transcription.request',
  'transcription.response',
  'transcription.status',
  'claude.start',
  'claude.done',
] as const

export type PipelineStage = (typeof ORDER)[number]

export function pipelineLog(stage: PipelineStage, data?: Record<string, unknown>): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  // eslint-disable-next-line no-console
  console.info(`%c[recall-pipeline] ${stage}`, 'color:#7c3aed;font-weight:600', data ?? {})
}
