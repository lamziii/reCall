/**
 * Foundation-phase placeholder. Renders with the real design tokens (so we can verify Tailwind v4 +
 * the token CSS pipeline works in Next) and states plainly that the route is a skeleton whose real
 * UI still lives in the Vite app at ../frontend. Server Component — no client code.
 *
 * Every one of these is replaced by a real port in checkpoints C1–C4 (see docs/NEXTJS_MIGRATION.md).
 */
export function MigrationPlaceholder({
  route,
  title,
  status = 'skeleton',
  note,
}: {
  route: string
  title: string
  status?: 'skeleton' | 'live-in-vite' | 'sample-backed'
  note?: string
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1 text-caption uppercase tracking-widest text-subtle-foreground">
        Next.js migration · {status}
      </span>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="text-body text-muted-foreground">
        Route <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">{route}</code> is
        wired in the App Router skeleton. Its production implementation still lives in the Vite app
        (<code className="rounded bg-surface px-1.5 py-0.5 text-foreground">frontend/</code>) and is
        ported in a later checkpoint.
      </p>
      {note ? <p className="text-small text-subtle-foreground">{note}</p> : null}
    </main>
  )
}
