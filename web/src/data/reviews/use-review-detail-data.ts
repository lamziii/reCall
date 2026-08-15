import { useCallback, useEffect, useState } from 'react'
import { getReviewDetailData, setReviewStatus } from './reviews-service'
import type { ReviewDetailData } from './types'
import type { ReviewStatusValue } from '@/components/recall/review-status'

export type ReviewDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: ReviewDetailData }

export function useReviewDetailData(sessionId: string | null) {
  const [state, setState] = useState<ReviewDetailState>({ status: 'idle' })

  const load = useCallback(() => {
    if (!sessionId) {
      setState({ status: 'idle' })
      return
    }
    setState({ status: 'loading' })
    try {
      const result = getReviewDetailData(sessionId)
      window.setTimeout(() => {
        setState(result && result !== 'not-found' ? { status: 'success', data: result } : { status: 'not-found' })
      }, 150)
    } catch {
      setState({ status: 'error' })
    }
  }, [sessionId])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = useCallback(
    (status: ReviewStatusValue) => {
      if (!sessionId) return
      const updated = setReviewStatus(sessionId, status)
      if (updated) setState({ status: 'success', data: updated })
    },
    [sessionId],
  )

  return { state, changeStatus }
}
