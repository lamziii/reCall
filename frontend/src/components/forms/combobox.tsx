import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from './input'
import { cn } from '@/lib/utils'
import type { SelectOption } from './select'

export interface ComboboxProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

/** Filterable single-select listbox: input + Popover + aria-activedescendant roving. */
export function Combobox({ options, value, onChange, placeholder = 'Select...', className }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
  const selected = options.find((option) => option.value === value)

  function selectOption(option: SelectOption) {
    onChange?.(option.value)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filtered[activeIndex]) selectOption(filtered[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Input
          value={open ? query : (selected?.label ?? '')}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls="combobox-listbox"
          aria-activedescendant={filtered[activeIndex] ? `combobox-option-${filtered[activeIndex].value}` : undefined}
          placeholder={placeholder}
          rightIcon={<ChevronDown />}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent placement="bottom-start" className="w-64 p-1">
        <div id="combobox-listbox" role="listbox" className="max-h-60 overflow-auto">
          {filtered.length === 0 && (
            <div className="px-2.5 py-4 text-center text-small text-subtle-foreground">No results</div>
          )}
          {filtered.map((option, index) => (
            <div
              key={option.value}
              id={`combobox-option-${option.value}`}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => {
                event.preventDefault()
                selectOption(option)
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-small text-foreground',
                index === activeIndex && 'bg-surface-hover',
              )}
            >
              {option.label}
              {option.value === value && <Check className="size-3.5 text-accent" />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
