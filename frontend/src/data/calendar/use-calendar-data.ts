import { useCallback, useEffect, useState } from 'react'
import { getCalendarMonthData } from './calendar-service'
import type { CalendarMonthData } from './types'

export type CalendarDataState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: CalendarMonthData }

export function useCalendarData(year: number, month: number) {
  const [state, setState] = useState<CalendarDataState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getCalendarMonthData(year, month)
      window.setTimeout(() => {
        setState(data ? { status: 'success', data } : { status: 'empty' })
      }, 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  return { state, refetch: load }
}
