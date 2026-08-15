import { useEffect, useState } from 'react'
import { getWorkspaceData } from '@/data/workspace-repository'
import { isDemoMode, isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeWorkspace } from './live-store'

/** Calendar-month key ("YYYY-MM") used to bucket Recall AI usage. Matches the server (recallAiChat). */
export function currentMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Recall AI questions used in the current calendar month + extra questions purchased on top of the plan. */
export function useAiUsage(): { used: number; bonus: number } {
  const { workspaceId } = useWorkspace()
  const [used, setUsed] = useState(0)
  const [bonus, setBonus] = useState(0)

  useEffect(() => {
    if (!isLiveMode) return
    const month = currentMonthKey()
    return subscribeWorkspace(
      workspaceId,
      (ws) => {
        setUsed(ws?.ai_usage?.[month] ?? 0)
        setBonus(ws?.bonus_ai_questions ?? 0)
      },
      () => {},
    )
  }, [workspaceId])

  if (isDemoMode) return { used: 0, bonus: getWorkspaceData()?.workspace.bonusAiQuestions ?? 0 }
  return { used, bonus }
}
