import { Plus, Pin, Trash2 } from 'lucide-react'
import { useRecallAiStore, type AiChat } from '@/lib/ai/recall-ai-provider'
import { useAiContext } from '@/lib/ai/use-ai-context'
import { RecallAiThread } from '@/components/ai/recall-ai-thread'
import { RecallAiComposer } from '@/components/ai/recall-ai-composer'
import { cn } from '@/lib/utils'

function ChatRow({
  chat,
  active,
  onOpen,
  onTogglePin,
  onDelete,
}: {
  chat: AiChat
  active: boolean
  onOpen: () => void
  onTogglePin: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-lg pl-3 pr-1.5 transition-fast',
        active ? 'bg-surface-selected' : 'hover:bg-surface-hover',
      )}
    >
      <button type="button" onClick={onOpen} className="focus-ring min-w-0 flex-1 py-2 text-left">
        <span className="block truncate text-small text-foreground">{chat.title}</span>
      </button>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label={chat.pinned ? 'Unpin chat' : 'Pin chat'}
          onClick={onTogglePin}
          className={cn(
            'focus-ring rounded p-1 text-subtle-foreground transition-fast hover:text-foreground',
            chat.pinned ? 'opacity-100 text-foreground' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <Pin className={cn('size-3.5', chat.pinned && 'fill-current')} />
        </button>
        <button
          type="button"
          aria-label={`Delete "${chat.title}"`}
          onClick={onDelete}
          className="focus-ring rounded p-1 text-subtle-foreground opacity-0 transition-fast hover:text-danger group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AssistantPage() {
  const ai = useRecallAiStore()
  const context = useAiContext()
  const busy = ai.state === 'connecting' || ai.state === 'streaming'

  const pinned = ai.chats.filter((c) => c.pinned)
  const recent = ai.chats.filter((c) => !c.pinned)

  const renderRow = (chat: AiChat) => (
    <li key={chat.id}>
      <ChatRow
        chat={chat}
        active={chat.id === ai.activeId}
        onOpen={() => ai.openChat(chat.id)}
        onTogglePin={() => ai.togglePin(chat.id)}
        onDelete={() => ai.deleteChat(chat.id)}
      />
    </li>
  )

  return (
    <div className="flex h-full min-h-0">
      {/* History */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
        <div className="p-3">
          <button
            type="button"
            onClick={ai.newChat}
            className="focus-ring flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-small font-medium text-foreground transition-fast hover:bg-surface-hover active:scale-[0.99]"
          >
            <Plus className="size-4" />
            New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {ai.chats.length === 0 ? (
            <p className="px-3 py-3 text-small text-subtle-foreground">Your conversations appear here.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pinned.length > 0 && (
                <div>
                  <p className="px-3 pb-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">Pinned</p>
                  <ul className="flex flex-col gap-0.5">{pinned.map(renderRow)}</ul>
                </div>
              )}
              <div>
                {pinned.length > 0 && (
                  <p className="px-3 pb-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">Recent</p>
                )}
                <ul className="flex flex-col gap-0.5">{recent.map(renderRow)}</ul>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
          <RecallAiThread
            messages={ai.messages}
            state={ai.state}
            entityType={context.entityType}
            onPick={ai.send}
            onRetry={ai.retry}
          />
          <RecallAiComposer onSend={ai.send} onStop={ai.stop} streaming={busy} />
        </div>
      </section>
    </div>
  )
}
