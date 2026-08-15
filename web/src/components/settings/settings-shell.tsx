import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from '@/lib/router-compat'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page'
import { Select } from '@/components/forms/select'
import { useRecallPreferences } from '@/settings/settings-context'
import { searchSettings, type SettingsSearchEntry } from '@/settings/settings-search'
import type { SettingsSectionKey } from '@/settings/types'

export interface SettingsNavItem {
  key: string
  label: string
}
export interface SettingsNavGroup {
  label: string
  items: SettingsNavItem[]
}

export function SettingsShell({
  groups,
  defaultSection,
}: {
  groups: SettingsNavGroup[]
  defaultSection: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const allKeys = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.key)), [groups])
  // Active section is derived from the URL (the child :section route). Only the <Outlet/> content
  // swaps when navigating between tabs — the header + nav below never remount, so tab clicks are
  // instant instead of re-rendering the whole page.
  const seg = location.pathname.match(/\/settings\/([^/]+)/)?.[1]
  const active = seg && allKeys.includes(seg) ? seg : defaultSection

  const { isSyncing, hasPendingSync } = useRecallPreferences()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => (query ? searchSettings(query) : []), [query])

  function go(key: string) {
    navigate(`/app/settings/${key}`)
  }

  // Focus search with "/" (matches app convention), ignoring when already typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement)?.isContentEditable) return
      e.preventDefault()
      searchRef.current?.querySelector('input')?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close the results popover on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // After navigating to a search result, scroll its row into view and briefly highlight it.
  useEffect(() => {
    if (!highlight) return
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(highlight)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.setAttribute('data-highlight', 'true')
      }
    })
    const timer = setTimeout(() => {
      document.getElementById(highlight)?.removeAttribute('data-highlight')
      setHighlight(null)
    }, 1600)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [highlight, active])

  function selectResult(entry: SettingsSearchEntry) {
    setQuery('')
    setSearchOpen(false)
    go(entry.section)
    setHighlight(entry.id)
  }

  const syncLabel = hasPendingSync || isSyncing ? 'Saving…' : 'Saved'

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-semibold text-foreground">Settings</h1>
          <p className="text-small text-muted-foreground">Customize how Recall looks and works.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-caption text-subtle-foreground sm:inline" aria-live="polite">
            {syncLabel}
          </span>
          <div ref={searchRef} className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              placeholder="Search settings"
              aria-label="Search settings"
              onChange={(e) => {
                setQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              className="focus-ring h-9 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-small text-foreground placeholder:text-subtle-foreground focus:border-border-accent"
            />
            {searchOpen && query && (
              <div
                style={{ zIndex: 'var(--z-dropdown)' }}
                className="absolute mt-1.5 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-surface-overlay p-1 shadow-lg"
              >
                {results.length === 0 ? (
                  <p className="px-3 py-2 text-caption text-muted-foreground">No settings match “{query}”.</p>
                ) : (
                  results.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => selectResult(entry)}
                      className="focus-ring flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-fast hover:bg-surface-hover"
                    >
                      <span className="text-small text-foreground">{entry.label}</span>
                      <span className="text-caption capitalize text-subtle-foreground">{entry.section}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile category selector */}
      <div className="mb-4 md:hidden">
        <Select
          aria-label="Settings category"
          value={active}
          onChange={(e) => go(e.target.value)}
          options={groups.flatMap((g) => g.items.map((i) => ({ value: i.key, label: `${g.label} · ${i.label}` })))}
        />
      </div>

      <div className="flex gap-8">
        {/* Desktop secondary navigation */}
        <nav aria-label="Settings sections" className="hidden w-48 shrink-0 flex-col gap-5 md:flex">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <span className="px-2 text-caption font-medium uppercase tracking-wide text-subtle-foreground">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.key)}
                  aria-current={active === item.key ? 'page' : undefined}
                  className={cn(
                    'focus-ring rounded-md px-2 py-1.5 text-left text-small transition-fast',
                    active === item.key ? 'bg-surface-active font-medium text-foreground' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Content — only this swaps between tabs (nested route <Outlet/>). */}
        <div className="min-w-0 flex-1 pb-16">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  )
}

export const CUSTOMIZATION_SECTIONS: SettingsSectionKey[] = [
  'appearance',
  'workspace',
  'notes',
  'productivity',
  'ai',
  'accessibility',
  'personalization',
  'experimental',
  'advanced',
]
