import type { Ref, RefCallback } from 'react'

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value)
      else if (ref && typeof ref === 'object') (ref as { current: T | null }).current = value
    }
  }
}
