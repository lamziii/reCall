/**
 * Auth layout. /login is FORCED DARK in the Vite app (<ForceTheme theme="dark">); pinning data-theme
 * here reproduces that regardless of the user's saved preference. Mirrors (marketing)/layout.tsx.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-dvh bg-bg text-foreground">
      {children}
    </div>
  )
}
