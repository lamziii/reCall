import { useNavigate } from '@/lib/router-compat'
import { MENTION_ICONS } from '@/components/recall/mention'
import { APP_BASE } from '@/app/shell/nav-config'
import { cn } from '@/lib/utils'
import type { EntityReference } from '@/lib/ai/types'

const ROUTE_FOR: Partial<Record<EntityReference['type'], (id: string) => string>> = {
  session: (id) => `${APP_BASE}/sessions/${id}`,
  project: (id) => `${APP_BASE}/projects/${id}`,
  person: (id) => `${APP_BASE}/people/${id}`,
}

/**
 * Renders source chips for the entities that are actually named in the answer — a lightweight,
 * honest evidence trail. We never invent a source: an entity only appears if its title occurs in
 * the answer text. Session/project/person chips deep-link into the app; others render inert.
 */
export function RecallAiSources({ entities, answer }: { entities: EntityReference[]; answer: string }) {
  const navigate = useNavigate()
  const haystack = answer.toLowerCase()
  const cited = entities.filter((e) => e.title && haystack.includes(e.title.toLowerCase())).slice(0, 5)
  if (!cited.length) return null

  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-border-subtle pt-3">
      <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Sources</span>
      <div className="flex flex-wrap gap-1.5">
        {cited.map((e) => {
          const Icon = MENTION_ICONS[e.type as keyof typeof MENTION_ICONS] ?? MENTION_ICONS.document
          const route = ROUTE_FOR[e.type]
          const interactive = Boolean(route)
          return (
            <button
              key={`${e.type}-${e.id}`}
              type="button"
              disabled={!interactive}
              onClick={route ? () => navigate(route(e.id)) : undefined}
              className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-caption text-muted-foreground',
                interactive && 'focus-ring cursor-pointer transition-fast hover:bg-surface-hover hover:text-foreground',
              )}
            >
              <Icon className="size-3 shrink-0 text-subtle-foreground" />
              <span className="truncate">{e.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
