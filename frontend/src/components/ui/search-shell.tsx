import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut'
import { cn } from '@/lib/utils'

export interface SearchShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (query: string) => void
  onKeyDown?: (event: React.KeyboardEvent) => void
  placeholder?: string
  children: ReactNode
  className?: string
}

/**
 * Shared top-aligned modal chrome (native <dialog> + search input header) for
 * CommandPalette and SearchOverlay — the only real difference between them is
 * what gets rendered in the results list, so the shell lives once, here.
 */
export function SearchShell({ open, onOpenChange, query, onQueryChange, onKeyDown, placeholder, children, className }: SearchShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  return (
    <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
      {open && (
        <motion.dialog
          ref={dialogRef}
          onCancel={(event) => {
            event.preventDefault()
            onOpenChange(false)
          }}
          onClick={(event) => {
            if (event.target === dialogRef.current) onOpenChange(false)
          }}
          initial={{ opacity: 0, scale: 0.98, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          // No `transform` here on purpose: Framer Motion owns `transform` for the scale/y
          // animation and silently overwrites a hand-set translateX, which was pushing this
          // off-center. `left/right: 0` + auto margins center it without touching transform.
          style={{ position: 'fixed', top: '15vh', left: 0, right: 0, marginInline: 'auto' }}
          className={cn(
            'm-0 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface-overlay p-0 shadow-xl',
            'backdrop:bg-neutral-950/70',
            className,
          )}
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <Search className="size-4 shrink-0 text-subtle-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-small text-foreground outline-none placeholder:text-subtle-foreground"
            />
            <KeyboardShortcut keys={['Esc']} />
          </div>
          <div className="max-h-80 overflow-auto p-2">{children}</div>
        </motion.dialog>
      )}
    </AnimatePresence>
  )
}
