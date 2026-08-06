import { useEffect, useState } from 'react'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { Label, Small, Body, Caption } from '@/components/typography'
import { useWorkspace } from '@/data/live/workspace-context'
import { useWorkspaceName } from '@/data/live/use-workspace-name'
import { useWorkspacePlan } from '@/data/live/use-workspace-plan'
import { useMonthlyUsageMinutes } from '@/data/live/use-monthly-usage'
import { isLiveMode } from '@/data/live/data-mode'
import { setWorkspacePlan } from '@/data/live/live-store'
import { getWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { PLANS, type PlanTier } from '@/data/plans'

const PLAN_OPTIONS = [
  { value: PLANS.pro.id, label: PLANS.pro.label },
  { value: PLANS.teams.id, label: PLANS.teams.label },
]

export function PlanSection() {
  const { workspaceId } = useWorkspace()
  const workspaceName = useWorkspaceName()
  const workspacePlan = useWorkspacePlan()
  const usedMinutes = useMonthlyUsageMinutes()
  const [plan, setPlan] = useState<PlanTier>(workspacePlan)

  // Keep local state in sync once the real (subscribed/localStorage) plan resolves.
  useEffect(() => setPlan(workspacePlan), [workspacePlan])

  async function handlePlanChange(next: PlanTier) {
    setPlan(next) // optimistic
    if (isLiveMode) {
      await setWorkspacePlan(workspaceId, next).catch(() => setPlan(workspacePlan))
    } else {
      const data = getWorkspaceData()
      if (data) saveWorkspaceData({ ...data, workspace: { ...data.workspace, plan: next } })
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <Label as="span">Plan</Label>
        <Small className="text-muted-foreground">Choose the plan that fits how you use Recall.</Small>
        <SegmentedControl
          aria-label="Plan"
          value={plan}
          onChange={(value) => void handlePlanChange(value as PlanTier)}
          options={PLAN_OPTIONS}
          className="mt-1.5 w-fit"
        />
        <Caption className="text-subtle-foreground">
          {usedMinutes} of {PLANS[plan].maxHoursPerMonth * 60} min used this month
        </Caption>
      </div>

      {plan === 'teams' && (
        <div className="flex flex-col gap-1.5">
          <Label as="span">Workspace</Label>
          <Small className="text-muted-foreground">You're the owner of this workspace.</Small>
          <Body className="mt-1 font-medium text-foreground">{workspaceName}</Body>
        </div>
      )}
    </div>
  )
}
