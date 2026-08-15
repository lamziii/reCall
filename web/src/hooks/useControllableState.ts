import { useCallback, useState } from 'react'

interface Options<T> {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}

/** Backs a component that can be either controlled or uncontrolled, e.g. `open`/`defaultOpen`. */
export function useControllableState<T>({ value, defaultValue, onChange }: Options<T>) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const isControlled = value !== undefined
  const state = isControlled ? value : uncontrolled

  const setState = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [state, setState] as const
}
