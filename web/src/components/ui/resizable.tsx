import { useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ResizablePanelGroupProps {
  direction?: 'horizontal' | 'vertical'
  defaultSize?: number
  minSize?: number
  maxSize?: number
  className?: string
  children: [ReactNode, ReactNode]
}

/**
 * Two-pane split with a draggable divider. Uses the Pointer Capture API so
 * drag events keep reaching the handle even off-target — no window listeners needed.
 */
export function ResizablePanelGroup({
  direction = 'horizontal',
  defaultSize = 50,
  minSize = 15,
  maxSize = 85,
  className,
  children: [first, second],
}: ResizablePanelGroupProps) {
  const [size, setSize] = useState(defaultSize)
  const groupRef = useRef<HTMLDivElement>(null)
  const isHorizontal = direction === 'horizontal'

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !groupRef.current) return
    const rect = groupRef.current.getBoundingClientRect()
    const pct = isHorizontal
      ? ((event.clientX - rect.left) / rect.width) * 100
      : ((event.clientY - rect.top) / rect.height) * 100
    setSize(Math.min(maxSize, Math.max(minSize, pct)))
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = 3
    const grow = isHorizontal ? 'ArrowRight' : 'ArrowDown'
    const shrink = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
    if (event.key === grow) setSize((s) => Math.min(maxSize, s + step))
    else if (event.key === shrink) setSize((s) => Math.max(minSize, s - step))
  }

  return (
    <div ref={groupRef} className={cn('flex min-h-0 min-w-0', isHorizontal ? 'flex-row' : 'flex-col', className)}>
      <div className="min-h-0 min-w-0 overflow-auto" style={{ [isHorizontal ? 'width' : 'height']: `${size}%` }}>
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(size)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className={cn(
          'focus-ring shrink-0 bg-border transition-fast hover:bg-accent',
          isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        )}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{second}</div>
    </div>
  )
}

export function ResizablePanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('size-full', className)} {...props} />
}
