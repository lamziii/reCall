import { useCallback, useEffect, useState } from 'react'
import { getReviewsListData } from './reviews-service'
import type { ReviewsListData } from './types'

export type ReviewsListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: ReviewsListData }

export function useReviewsListData() {
  const [state, setState] = useState<ReviewsListState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getReviewsListData()
      window.setTimeout(() => {
        setState(data && data.reviews.length > 0 ? { status: 'success', data } : { status: 'empty' })
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
