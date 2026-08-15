/** Shared Recall AI types (client). */

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /** Entities referenced in the context that produced this answer — used for source chips. */
  sources?: EntityReference[]
  /** Set when this assistant turn failed; the composer keeps the user's text so they can retry. */
  error?: string
}

export type EntityType = 'session' | 'project' | 'task' | 'person' | 'decision'

export interface EntityReference {
  type: EntityType
  id: string
  title: string
}

/** Where the user is right now — sent with each request so answers are context-aware. */
export interface AIContext {
  route: string
  entityType: EntityType | null
  entityId: string | null
  entityTitle: string | null
}

/** SSE payloads streamed back from recallAiChat. */
export type StreamEvent =
  | { type: 'context'; entities: EntityReference[] }
  | { type: 'text'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string; retryAfter?: number }

export type StreamState = 'idle' | 'connecting' | 'streaming' | 'error'
