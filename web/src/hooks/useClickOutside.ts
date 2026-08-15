import { useEffect } from 'react'
import type { RefObject } from 'react'

/** Fires `handler` on any pointer event outside every ref in `refs`. */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      const isInside = refs.some((ref) => ref.current?.contains(target))
      if (!isInside) handler()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [refs, handler, active])
}
