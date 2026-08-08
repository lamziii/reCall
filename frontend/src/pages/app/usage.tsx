import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CreditCard, Gauge, Mic, MessageSquare } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/data-display/card'
import { Metric } from '@/components/data-display/metric'
import { Progress } from '@/components/feedback/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label, Small, Caption } from '@/components/typography'
import { useToast } from '@/components/feedback'
import { useWorkspace } from '@/data/live/workspace-context'
import { useWorkspacePlan } from '@/data/live/use-workspace-plan'
import { useWorkspaceBonusMinutes } from '@/data/live/use-workspace-bonus-minutes'
import { useMonthlyUsageStats } from '@/data/live/use-monthly-usage'
import { useAiUsage } from '@/data/live/use-ai-usage'
import { isLiveMode } from '@/data/live/data-mode'
import { addWorkspaceBonusMinutes, addWorkspaceBonusAiQuestions } from '@/data/live/live-store'
import { getWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { PLANS, USAGE_PACKS, AI_QUESTION_PACKS, type UsagePack, type AiQuestionPack } from '@/data/plans'

function formatHoursMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function UsagePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { workspaceId } = useWorkspace()
  const plan = useWorkspacePlan()
  const bonusMinutes = useWorkspaceBonusMinutes()
  const { minutes: usedMinutes, sessionCount } = useMonthlyUsageStats()
  const { used: aiUsed, bonus: aiBonus } = useAiUsage()
  const [purchase, setPurchase] = useState<{ label: string; tagline: string; run: () => Promise<void> } | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  const includedMinutes = PLANS[plan].maxHoursPerMonth * 60
  const capMinutes = includedMinutes + bonusMinutes
  const remainingMinutes = Math.max(0, capMinutes - usedMinutes)
  const percentUsed = capMinutes > 0 ? (usedMinutes / capMinutes) * 100 : 0
  const avgSessionMinutes = sessionCount > 0 ? Math.round(usedMinutes / sessionCount) : 0

  const aiLimit = PLANS[plan].maxAiQuestionsPerMonth + aiBonus
  const aiRemaining = Math.max(0, aiLimit - aiUsed)
  const aiPercent = aiLimit > 0 ? Math.min(100, (aiUsed / aiLimit) * 100) : 0

  async function addMinutes(pack: UsagePack) {
    if (isLiveMode) {
      await addWorkspaceBonusMinutes(workspaceId, pack.minutesAdded)
    } else {
      const data = getWorkspaceData()
      if (data) saveWorkspaceData({ ...data, workspace: { ...data.workspace, bonusMinutes: (data.workspace.bonusMinutes ?? 0) + pack.minutesAdded } })
    }
  }

  async function addAiQuestions(pack: AiQuestionPack) {
    if (isLiveMode) {
      await addWorkspaceBonusAiQuestions(workspaceId, pack.questionsAdded)
    } else {
      const data = getWorkspaceData()
      if (data) saveWorkspaceData({ ...data, workspace: { ...data.workspace, bonusAiQuestions: (data.workspace.bonusAiQuestions ?? 0) + pack.questionsAdded } })
    }
  }

  async function runPurchase() {
    if (!purchase) return
    setPurchasing(true)
    try {
      await purchase.run()
      toast({ title: `Added ${purchase.label}`, description: 'Your workspace limit for this month has been increased.', variant: 'success' })
      setPurchase(null)
    } catch {
      toast({ title: "Couldn't complete purchase", description: 'Check your connection and try again.', variant: 'danger' })
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Usage"
        description="Track how much you've used this month and manage your plan."
        actions={
          <Button variant="secondary" onClick={() => navigate('/app/settings')}>
            Manage plan
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Used this month" value={formatHoursMinutes(usedMinutes)} icon={<Clock />} />
        <Metric label="Remaining" value={formatHoursMinutes(remainingMinutes)} icon={<Gauge />} />
        <Metric label="Sessions recorded" value={sessionCount} icon={<Mic />} />
        <Metric label="AI questions left" value={`${aiRemaining} / ${aiLimit}`} icon={<MessageSquare />} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{PLANS[plan].label}</CardTitle>
          <CardDescription>{PLANS[plan].tagline}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={percentUsed} label="Monthly usage" />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Caption className="text-subtle-foreground">
              {formatHoursMinutes(usedMinutes)} of {formatHoursMinutes(capMinutes)} used
              {bonusMinutes > 0 && ` (includes +${formatHoursMinutes(bonusMinutes)} purchased)`}
            </Caption>
            {avgSessionMinutes > 0 && <Caption className="text-subtle-foreground">~{avgSessionMinutes} min avg. session</Caption>}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recall AI questions</CardTitle>
          <CardDescription>How many questions you can ask Recall AI this month.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={aiPercent} label="Recall AI usage" />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <Caption className="text-subtle-foreground">
              {aiUsed} of {aiLimit} used
              {aiBonus > 0 && ` (includes +${aiBonus} purchased)`}
            </Caption>
            <Caption className="text-subtle-foreground">{aiRemaining} remaining</Caption>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label as="span">Buy more usage</Label>
          <Small className="text-muted-foreground">Running low this month? Add extra hours on top of your plan's cap.</Small>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {USAGE_PACKS.map((pack) => (
            <Card key={pack.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{pack.label}</CardTitle>
                <CardDescription>{pack.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<CreditCard />}
                  onClick={() => setPurchase({ label: pack.label, tagline: pack.tagline, run: () => addMinutes(pack) })}
                >
                  Add hours
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label as="span">Buy more Recall AI questions</Label>
          <Small className="text-muted-foreground">Need to ask more this month? Add extra questions on top of your plan's limit.</Small>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AI_QUESTION_PACKS.map((pack) => (
            <Card key={pack.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{pack.label}</CardTitle>
                <CardDescription>{pack.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<CreditCard />}
                  onClick={() => setPurchase({ label: pack.label, tagline: pack.tagline, run: () => addAiQuestions(pack) })}
                >
                  Add questions
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={purchase !== null} onOpenChange={(open) => !open && setPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {purchase?.label}?</DialogTitle>
            <DialogDescription>
              This increases your workspace's limit for the current billing cycle. {purchase?.tagline}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPurchase(null)} disabled={purchasing}>
              Cancel
            </Button>
            <Button onClick={() => void runPurchase()} loading={purchasing}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
