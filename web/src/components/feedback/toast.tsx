import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

export type ToastVariant = 'default' | 'success' | 'danger' | 'warning' | 'loading'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: string
}

interface PromiseMessages<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: unknown) => string)
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
  promise: <T>(promise: Promise<T>, messages: PromiseMessages<T>) => Promise<T>
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<Exclude<ToastVariant, 'loading'>, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  danger: AlertCircle,
  warning: AlertTriangle,
}

const ICON_COLOR: Record<Exclude<ToastVariant, 'loading'>, string> = {
  default: 'text-subtle-foreground',
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, duration: 4000, variant: 'default', ...options }])
    return id
  }, [])

  const promise = useCallback(
    async <T,>(pending: Promise<T>, messages: PromiseMessages<T>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, title: messages.loading, variant: 'loading', duration: undefined }])
      try {
        const data = await pending
        dismiss(id)
        toast({ title: typeof messages.success === 'function' ? messages.success(data) : messages.success, variant: 'success' })
        return data
      } catch (error) {
        dismiss(id)
        toast({ title: typeof messages.error === 'function' ? messages.error(error) : messages.error, variant: 'danger' })
        throw error
      }
    },
    [dismiss, toast],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss, promise }}>
      {children}
      <Portal>
        <ol
          className="fixed bottom-4 right-4 flex w-full max-w-sm flex-col gap-2"
          style={{ zIndex: 'var(--z-toast)' }}
          aria-live="polite"
        >
          <AnimatePresence>
            {toasts.map((item) => (
              <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
            ))}
          </AnimatePresence>
        </ol>
      </Portal>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const variant = item.variant ?? 'default'

  useEffect(() => {
    if (!item.duration) return
    const timer = setTimeout(onDismiss, item.duration)
    return () => clearTimeout(timer)
  }, [item.duration, onDismiss])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 rounded-lg border border-border bg-surface-overlay p-3.5 shadow-lg"
    >
      {variant === 'loading' ? (
        <Spinner size="sm" label="" className="mt-0.5 shrink-0 text-subtle-foreground" />
      ) : (
        (() => {
          const Icon = ICONS[variant]
          return <Icon className={cn('mt-0.5 size-4 shrink-0', ICON_COLOR[variant])} />
        })()
      )}
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium text-foreground">{item.title}</p>
        {item.description && <p className="mt-0.5 text-small text-muted-foreground">{item.description}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="focus-ring rounded p-0.5 text-subtle-foreground transition-fast hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </motion.li>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast() must be used inside <ToastProvider>')
  return ctx
}
