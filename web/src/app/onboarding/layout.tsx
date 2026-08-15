/**
 * Onboarding is FORCED DARK in the Vite app (<ForceTheme theme="dark">). Pin data-theme here to
 * reproduce that regardless of the user's saved preference. Mirrors (marketing)/(auth) layouts.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-dvh bg-bg text-foreground">
      {children}
    </div>
  )
}
