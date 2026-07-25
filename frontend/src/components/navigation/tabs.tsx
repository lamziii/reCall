import { createContext, useContext, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(component: string) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error(`<${component} /> must be used inside <Tabs>`)
  return ctx
}

export interface TabsProps {
  children: ReactNode
  value?: string
  defaultValue: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({ children, value, defaultValue, onValueChange, className }: TabsProps) {
  const [current, setValue] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const baseId = useId()

  return (
    <TabsContext.Provider value={{ value: current, setValue, baseId }}>
      <div className={cn('flex flex-col gap-3', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  const listRef = useRef<HTMLDivElement>(null)

  function onKeyDown(event: React.KeyboardEvent) {
    const tabs = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])
    const index = tabs.indexOf(document.activeElement as HTMLElement)
    if (index === -1) return

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      tabs[(index + 1) % tabs.length]?.focus()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      tabs[(index - 1 + tabs.length) % tabs.length]?.focus()
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn('flex items-center gap-1 border-b border-border', className)}
    >
      {children}
    </div>
  )
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { value: active, setValue, baseId } = useTabsContext('Tab')
  const isActive = active === value

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'focus-ring relative px-3 py-2 text-small font-medium transition-fast',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
    </button>
  )
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { value: active, baseId } = useTabsContext('TabPanel')
  if (active !== value) return null

  return (
    <div role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-tab-${value}`} className={className}>
      {children}
    </div>
  )
}
