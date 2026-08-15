import { useCallback, useEffect, useState } from 'react'
import { getPeopleListData } from './people-service'
import type { PeopleListData } from './types'

export type PeopleListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: PeopleListData }

export function usePeopleListData() {
  const [state, setState] = useState<PeopleListState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getPeopleListData()
      window.setTimeout(() => {
        setState(data ? { status: 'success', data } : { status: 'empty' })
      }, 250)
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { state, refetch: load }
}
