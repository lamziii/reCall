import { useEffect } from 'react'

/** Calls `handler` when Escape is pressed while `active`. */
export function useEscapeKey(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handler()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handler, active])
}
