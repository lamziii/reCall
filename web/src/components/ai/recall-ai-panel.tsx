import { useEffect } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useRecallAiStore } from '@/lib/ai/recall-ai-provider'
import { useAiContext } from '@/lib/ai/use-ai-context'
import { APP_BASE } from '@/app/shell/nav-config'
import { RecallAiHeader } from './recall-ai-header'
import { RecallAiThread } from './recall-ai-thread'
import { RecallAiComposer } from './recall-ai-composer'

const CONTEXT_LABEL: Record<string, string> = {
  session: 'This meeting',
  project: 'This project',
  person: 'This person',
}

/**
 * Right-docked Recall AI assistant. Kept mounted so the conversation survives open/close; only the
 * visible surface animates in from the right (~190ms ease-out, skipped under reduced motion).
 * Full-screen on mobile, a 400px dock with a hairline left border on desktop. Escape closes.
 */
export function RecallAiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ai = useRecallAiStore()
  const context = useAiContext()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const contextLabel = context.entityType ? CONTEXT_LABEL[context.entityType] ?? 'Current workspace' : 'Current workspace'
  const busy = ai.state === 'connecting' || ai.state === 'streaming'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, busy])

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="Recall AI"
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-bg shadow-[-8px_0_40px_-16px_rgba(0,0,0,0.5)] sm:w-[400px]"
          initial={reduce ? { opacity: 0 } : { x: '100%' }}
          animate={reduce ? { opacity: 1 } : { x: 0 }}
          exit={reduce ? { opacity: 0 } : { x: '100%' }}
          transition={{ duration: 0.19, ease: [0, 0, 0.2, 1] }}
        >
          <RecallAiHeader
            contextLabel={contextLabel}
            onNewChat={ai.newChat}
            onExpand={() => {
              onClose()
              navigate(`${APP_BASE}/assistant`)
            }}
            onClose={onClose}
          />
          <RecallAiThread
            messages={ai.messages}
            state={ai.state}
            entityType={context.entityType}
            onPick={ai.send}
            onRetry={ai.retry}
          />
          <RecallAiComposer onSend={ai.send} onStop={ai.stop} streaming={busy} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
