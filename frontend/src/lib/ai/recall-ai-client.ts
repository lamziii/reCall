import { getFirebaseAuth } from '@/lib/firebase/auth'
import { recallAiChatUrl } from '@/lib/firebase/config'
import type { AIContext, ChatMessage, StreamEvent } from './types'

export class RecallAiError extends Error {
  code: string
  constructor(message: string, code = 'server') {
    super(message)
    this.code = code
  }
}

export interface StreamChatOptions {
  messages: Pick<ChatMessage, 'role' | 'content'>[]
  workspaceId: string
  context: AIContext
  signal: AbortSignal
  onEvent: (event: StreamEvent) => void
}

/**
 * Streams a Recall AI answer over SSE. POSTs the trimmed message history + page context to the
 * authenticated recallAiChat function and parses the `data:` event stream, invoking `onEvent` for
 * each payload. The Anthropic key never touches the client — this only carries the user's ID token.
 * Abort via the passed AbortSignal (the panel's Stop button / closing the panel).
 */
export async function streamRecallAiChat({ messages, workspaceId, context, signal, onEvent }: StreamChatOptions): Promise<void> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new RecallAiError('You need to be signed in to use Recall AI.', 'auth')
  const token = await user.getIdToken()

  let res: Response
  try {
    res = await fetch(recallAiChatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        workspaceId,
        context: { route: context.route, entityType: context.entityType, entityId: context.entityId },
      }),
      signal,
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return
    throw new RecallAiError("Recall couldn't reach the server. Check your connection and try again.", 'network')
  }

  // Non-2xx before the stream opens comes back as JSON, not SSE.
  if (!res.ok || !res.body) {
    let message = "Recall couldn't answer that just now."
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      /* keep default */
    }
    const code = res.status === 429 ? 'rate_limit' : res.status === 402 ? 'limit' : 'server'
    throw new RecallAiError(message, code)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE events are separated by a blank line; each carries one `data:` JSON payload.
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const line = chunk.split('\n').find((l) => l.startsWith('data:'))
        if (!line) continue
        try {
          onEvent(JSON.parse(line.slice(5).trim()) as StreamEvent)
        } catch {
          /* ignore a malformed frame */
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return
    throw new RecallAiError('The connection was interrupted. Please try again.', 'network')
  }
}
