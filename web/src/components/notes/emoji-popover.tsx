'use client'

/**
 * Compact page-icon chooser for Notes. A small curated grid — deliberately NOT a full emoji keyboard
 * (YAGNI). `onPick(null)` removes the icon. Extend EMOJIS or swap for a full picker later; the API
 * (value + onPick) is the stable seam.
 */
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const EMOJIS = [
  '📘', '📝', '📄', '🗒️', '📌', '⭐', '🔥', '💡', '✅', '🎯',
  '🚀', '🧠', '📊', '📈', '🗂️', '🔖', '🧩', '⚙️', '🐛', '🔒',
  '💬', '📅', '🏷️', '🎨', '🧪', '📎', '❤️', '☕', '🌱', '🏁',
]

export function EmojiPopover({
  value,
  onPick,
  trigger,
  placement = 'bottom-start',
}: {
  value?: string | null
  onPick: (emoji: string | null) => void
  trigger: React.ReactElement<Record<string, unknown>>
  placement?: React.ComponentProps<typeof PopoverContent>['placement']
}) {
  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent placement={placement} trapFocus width={240} className="p-2">
        <div className="grid grid-cols-6 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onPick(e)}
              className={cn(
                'focus-ring flex size-8 items-center justify-center rounded-md text-[1.1rem] transition-fast hover:bg-surface-hover',
                value === e && 'bg-surface-active',
              )}
            >
              {e}
            </button>
          ))}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="focus-ring mt-2 w-full rounded-md px-2 py-1.5 text-left text-caption text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground"
          >
            Remove icon
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
