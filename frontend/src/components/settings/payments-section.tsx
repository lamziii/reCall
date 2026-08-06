import { useNavigate } from 'react-router-dom'
import { CreditCard, Receipt } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/data-display/card'
import { Button } from '@/components/ui/button'
import { Label, Small, Caption } from '@/components/typography'
import { PLANS, type PlanTier } from '@/data/plans'
import { MARKETING_PLANS } from '@/pages/plans/plan-data'

export function PaymentsSection({ plan }: { plan: PlanTier }) {
  const navigate = useNavigate()
  const marketing = MARKETING_PLANS.find((p) => p.id === plan)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{PLANS[plan].label}</CardTitle>
          <CardDescription>{PLANS[plan].tagline}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-baseline gap-1">
          <span className="text-h2 font-semibold text-foreground">{marketing?.price ?? '—'}</span>
          <span className="text-small text-muted-foreground">{marketing?.priceSuffix}</span>
        </CardContent>
        <CardFooter>
          <Caption className="text-subtle-foreground">Billed monthly. Change your plan from the Plan tab.</Caption>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-1">
        <Label as="span">Payment method</Label>
        <Small className="text-muted-foreground">Billing is handled securely outside Recall — no card details are stored here.</Small>
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-subtle-foreground">
            <Receipt className="size-4" />
          </span>
          <div className="flex flex-col">
            <Small className="text-foreground">Need more usage this month?</Small>
            <Caption className="text-subtle-foreground">Buy extra hours on top of your plan's cap.</Caption>
          </div>
        </div>
        <Button variant="secondary" leftIcon={<CreditCard />} onClick={() => navigate('/app/usage')}>
          Go to Usage &amp; top-ups
        </Button>
      </Card>
    </div>
  )
}
