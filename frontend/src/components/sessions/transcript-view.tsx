import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { MessageSquare } from 'lucide-react'
import { SearchInput } from '@/components/forms/search-input'
import { TranscriptSpeaker } from '@/components/recall/transcript-speaker'
import { EmptyState } from '@/components/feedback/empty-state'
import type { TranscriptEntry } from '@/data/sessions/types'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded-sm bg-accent-muted text-accent">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export interface TranscriptViewProps {
  entries: TranscriptEntry[]
  activeEntryId?: string | null
}

export function TranscriptView({ entries, activeEntryId }: TranscriptViewProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.text.toLowerCase().includes(q) || e.speakerName.toLowerCase().includes(q))
  }, [entries, query])

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="No transcript available"
        description="This session doesn't have a transcript yet."
        className="py-8"
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search transcript..." className="max-w-sm" />
      <div className="flex flex-col gap-1">
        {filtered.length === 0 ? (
          <p className="px-2 py-8 text-center text-small text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} id={`transcript-${entry.id}`}>
              <TranscriptSpeaker name={entry.speakerName} timestamp={entry.timestampLabel} active={entry.id === activeEntryId}>
                {highlight(entry.text, query)}
              </TranscriptSpeaker>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
