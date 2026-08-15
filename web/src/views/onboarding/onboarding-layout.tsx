import type { ReactNode } from 'react'

export function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-bg px-6 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_38%,rgba(255,255,255,0.035),transparent_70%)]"
      />
      <div className="w-full max-w-[560px]">{children}</div>
    </div>
  )
}
