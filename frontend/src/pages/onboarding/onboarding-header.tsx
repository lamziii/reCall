import { Wordmark } from '@/components/branding/logo'
import { H1, BodyLarge, Label } from '@/components/typography'

export function OnboardingHeader() {
  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <a href="/" className="focus-ring w-fit rounded-xl" aria-label="Recall home">
        <Wordmark size="lg" className="h-11" />
      </a>

      <div className="flex flex-col items-center gap-4">
        <Label as="span">Welcome to Recall</Label>
        <H1 className="text-balance">Let's set up your workspace</H1>
        <BodyLarge className="max-w-sm text-balance text-muted-foreground">
          We'll personalize Recall for your team. This only takes about a minute.
        </BodyLarge>
      </div>
    </div>
  )
}
