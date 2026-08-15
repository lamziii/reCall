/**
 * Marketing/public layout. These routes are FORCED DARK in the Vite app (<ForceTheme theme="dark">).
 * Setting data-theme on this wrapper pins the dark token palette for the public surface regardless
 * of the user's saved preference, matching current behavior. Server Component.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-dvh bg-bg text-foreground">
      {children}
    </div>
  )
}
