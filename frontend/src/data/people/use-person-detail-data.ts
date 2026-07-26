import { useCallback, useEffect, useState } from 'react'
import { getPersonDetailData } from './people-service'
import type { PersonDetailData } from './types'

export type PersonDetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: PersonDetailData }

export function usePersonDetailData(personId: string | undefined) {
  const [state, setState] = useState<PersonDetailState>({ status: 'loading' })

  const load = useCallback(() => {
    if (!personId) {
      setState({ status: 'not-found' })
      return
    }
    setState({ status: 'loading' })
    try {
      const result = getPersonDetailData(personId)
      window.setTimeout(() => {
        setState(result && result !== 'not-found' ? { status: 'success', data: result } : { status: 'not-found' })
      }, 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [personId])

  useEffect(() => {
    load()
  }, [load])

  return { state, refetch: load }
}
