import { Wordmark } from '@/components/branding/logo'

/** Minimal onboarding header: just the wordmark. Each step carries its own heading, so we avoid a
 *  giant top-of-page title on every screen. */
export function OnboardingHeader() {
  return (
    <div className="flex justify-center">
      <a href="/" className="focus-ring w-fit rounded-xl" aria-label="Recall home">
        <Wordmark size="lg" className="h-9" />
      </a>
    </div>
  )
}
