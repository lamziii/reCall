import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useWorkspace } from '@/data/live/workspace-context'
import { streamRecallAiChat, RecallAiError } from './recall-ai-client'
import { useAiContext } from './use-ai-context'
import type { AIContext, ChatMessage, StreamState } from './types'

export interface AiChat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

const MAX_CHATS = 40
let counter = 0
const nextId = () => `c${Date.now()}-${counter++}`
const storageKey = (workspaceId: string) => `recall:ai-chats:${workspaceId}`

function loadChats(workspaceId: string): AiChat[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId))
    const chats = raw ? (JSON.parse(raw) as AiChat[]) : []
    return Array.isArray(chats) ? chats : []
  } catch {
    return []
  }
}

function persistChats(workspaceId: string, chats: AiChat[]) {
  try {
    window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(chats.slice(0, MAX_CHATS)))
  } catch {
    /* quota / private mode — history is best-effort */
  }
}

function titleFrom(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')?.content ?? 'New chat'
  const clean = first.replace(/\s+/g, ' ').trim()
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || 'New chat'
}

export interface RecallAiStore {
  chats: AiChat[]
  activeId: string | null
  messages: ChatMessage[]
  state: StreamState
  send: (text: string) => void
  retry: () => void
  stop: () => void
  newChat: () => void
  openChat: (id: string) => void
  deleteChat: (id: string) => void
  togglePin: (id: string) => void
}

const Ctx = createContext<RecallAiStore | null>(null)

/**
 * Single source of truth for Recall AI, shared by the toolbar panel and the full assistant page.
 * Streams answers through recallAiChat and persists each conversation to localStorage so past chats
 * survive reloads. Mount once inside the authenticated shell (below the router, so page-context is
 * available). History is client-side only — a deliberate, demo-appropriate choice; the seam is the
 * same one a server-backed store would expose.
 */
export function RecallAiProvider({ children }: { children: ReactNode }) {
  const { workspaceId } = useWorkspace()
  const context = useAiContext()

  const [chats, setChats] = useState<AiChat[]>(() => loadChats(workspaceId))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [state, setState] = useState<StreamState>('idle')

  const abortRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages
  const activeIdRef = useRef<string | null>(activeId)
  activeIdRef.current = activeId
  const ctxRef = useRef<{ workspaceId: string; context: AIContext }>({ workspaceId, context })
  ctxRef.current = { workspaceId, context }

  // Reload history when the workspace changes; abort anything in flight on unmount.
  useEffect(() => {
    setChats(loadChats(workspaceId))
    setActiveId(null)
    setMessages([])
  }, [workspaceId])
  useEffect(() => () => abortRef.current?.abort(), [])

  const upsertActive = useCallback(
    (msgs: ChatMessage[]) => {
      const id = activeIdRef.current
      if (!id || !msgs.length) return
      setChats((prev) => {
        const now = Date.now()
        const existing = prev.find((c) => c.id === id)
        const chat: AiChat = existing
          ? { ...existing, messages: msgs, title: existing.title, updatedAt: now }
          : { id, title: titleFrom(msgs), messages: msgs, createdAt: now, updatedAt: now }
        const next = [chat, ...prev.filter((c) => c.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt)
        persistChats(ctxRef.current.workspaceId, next)
        return next
      })
    },
    [],
  )

  const run = useCallback(
    (history: ChatMessage[]) => {
      if (abortRef.current) return
      const assistantId = nextId()
      const controller = new AbortController()
      abortRef.current = controller
      setState('connecting')
      setMessages([...history, { id: assistantId, role: 'assistant', content: '' }])

      void streamRecallAiChat({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        workspaceId: ctxRef.current.workspaceId,
        context: ctxRef.current.context,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'context') {
            setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, sources: event.entities } : m)))
          } else if (event.type === 'text') {
            setState('streaming')
            setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.text } : m)))
          } else if (event.type === 'error') {
            setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, error: event.message } : m)))
            setState('error')
          }
        },
      })
        .then(() => setState((s) => (s === 'error' ? s : 'idle')))
        .catch((err) => {
          const message = err instanceof RecallAiError ? err.message : "Recall couldn't answer that just now."
          setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, error: message } : m)))
          setState('error')
        })
        .finally(() => {
          abortRef.current = null
          upsertActive(messagesRef.current)
        })
    },
    [upsertActive],
  )

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || abortRef.current) return
      if (!activeIdRef.current) {
        // Assign the chat id synchronously so the first persist lands on the right conversation.
        const id = nextId()
        activeIdRef.current = id
        setActiveId(id)
      }
      run([...messagesRef.current, { id: nextId(), role: 'user', content: trimmed }])
    },
    [run],
  )

  const retry = useCallback(() => {
    if (abortRef.current) return
    const prev = messagesRef.current
    const trimmed = prev[prev.length - 1]?.role === 'assistant' ? prev.slice(0, -1) : prev
    if (trimmed.length && trimmed[trimmed.length - 1].role === 'user') run(trimmed)
  }, [run])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState('idle')
    upsertActive(messagesRef.current)
  }, [upsertActive])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setActiveId(null)
    activeIdRef.current = null
    setMessages([])
    setState('idle')
  }, [])

  const openChat = useCallback((id: string) => {
    abortRef.current?.abort()
    abortRef.current = null
    setActiveId(id)
    activeIdRef.current = id
    setChats((prev) => {
      const chat = prev.find((c) => c.id === id)
      setMessages(chat ? chat.messages : [])
      return prev
    })
    setState('idle')
  }, [])

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id)
      persistChats(ctxRef.current.workspaceId, next)
      return next
    })
    if (activeIdRef.current === id) newChat()
  }, [newChat])

  const togglePin = useCallback((id: string) => {
    setChats((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
      persistChats(ctxRef.current.workspaceId, next)
      return next
    })
  }, [])

  const value = useMemo<RecallAiStore>(
    () => ({ chats, activeId, messages, state, send, retry, stop, newChat, openChat, deleteChat, togglePin }),
    [chats, activeId, messages, state, send, retry, stop, newChat, openChat, deleteChat, togglePin],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRecallAiStore(): RecallAiStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRecallAiStore must be used within <RecallAiProvider>.')
  return ctx
}
