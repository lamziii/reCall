import { useNavigate } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import { Surface } from '@/components/layout/surface'
import { Button, buttonVariants } from '@/components/ui/button'
import { Caption, Small, Title } from '@/components/typography'
import { APP_BASE } from '@/app/shell/nav-config'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'
import type { MarketingPlan } from './plan-data'

export function PlanCard({ plan }: { plan: MarketingPlan }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMailto = plan.cta.href.startsWith('mailto:')
  // Already signed in? The onboarding funnel would just loop them back out, so send them to the app.
  const ctaHref = user && !isMailto ? APP_BASE : plan.cta.href
  const ctaLabel = user && !isMailto ? 'Go to dashboard' : plan.cta.label

  return (
    <Surface
      level={plan.highlighted ? 'raised' : 'surface'}
      border
      padding="lg"
      className={cn('relative flex flex-col gap-6', plan.highlighted && 'border-border-accent')}
    >
      {plan.highlighted && (
        <Caption className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
          Most popular
        </Caption>
      )}

      <div className="flex flex-col gap-1.5">
        <Title>{plan.name}</Title>
        <Small className="text-muted-foreground">{plan.tagline}</Small>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-h1 font-semibold tracking-tight text-foreground">{plan.price}</span>
          {plan.priceSuffix && <span className="text-small text-muted-foreground">{plan.priceSuffix}</span>}
        </div>
        {plan.priceNote && <Caption className="text-subtle-foreground">{plan.priceNote}</Caption>}
      </div>

      {isMailto ? (
        <a href={plan.cta.href} className={cn(buttonVariants({ variant: plan.highlighted ? 'primary' : 'secondary', size: 'lg' }), 'w-full')}>
          {plan.cta.label}
        </a>
      ) : (
        <Button variant={plan.highlighted ? 'primary' : 'secondary'} size="lg" fullWidth onClick={() => navigate(ctaHref)}>
          {ctaLabel}
        </Button>
      )}

      <ul className="flex flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5">
            {feature.included ? (
              <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            ) : (
              <Minus className="mt-0.5 size-4 shrink-0 text-disabled-foreground" aria-hidden />
            )}
            <Small className={feature.included ? 'text-foreground' : 'text-subtle-foreground'}>{feature.label}</Small>
          </li>
        ))}
      </ul>
    </Surface>
  )
}
