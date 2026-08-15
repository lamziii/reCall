import { useLocation } from '@/lib/router-compat'
import type { AIContext, EntityType } from './types'

const ENTITY_ROUTES: { re: RegExp; type: EntityType }[] = [
  { re: /\/app\/sessions\/([^/]+)/, type: 'session' },
  { re: /\/app\/projects\/([^/]+)/, type: 'project' },
  { re: /\/app\/people\/([^/]+)/, type: 'person' },
]

/**
 * Derives the current page context (route + focused entity) from the URL. Sent with every AI
 * request so the assistant knows what the user is looking at. Parses the pathname directly rather
 * than useParams so it works from the app shell (above the routed Outlet).
 */
export function useAiContext(): AIContext {
  const { pathname } = useLocation()
  for (const { re, type } of ENTITY_ROUTES) {
    const m = pathname.match(re)
    if (m) return { route: pathname, entityType: type, entityId: m[1], entityTitle: null }
  }
  return { route: pathname, entityType: null, entityId: null, entityTitle: null }
}
