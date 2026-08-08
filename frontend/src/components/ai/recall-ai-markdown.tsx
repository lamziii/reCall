import type { ReactNode } from 'react'

/**
 * Deliberately small Markdown renderer for assistant answers — headings, bullets, bold, and inline
 * code, rendered on the panel background with restrained styling. Not a full CommonMark engine (no
 * tables/links/images), which keeps it cheap to re-run on every streamed token. Content is plain
 * text from the model; we only ever emit spans/lists, never dangerouslySetInnerHTML.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Split on **bold** and `code`, keeping the delimiters via capture groups.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="rounded bg-surface-active px-1 py-0.5 font-mono text-[0.85em] text-foreground">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={key}>{part}</span>
  })
}

export function RecallAiMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  let paragraph: string[] = []
  let key = 0

  const flushBullets = () => {
    if (!bullets.length) return
    const items = bullets
    blocks.push(
      <ul key={`ul-${key++}`} className="my-2 flex flex-col gap-1.5 pl-1">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-subtle-foreground" aria-hidden />
            <span className="min-w-0">{renderInline(b, `li-${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  const flushParagraph = () => {
    if (!paragraph.length) return
    const text = paragraph.join(' ')
    blocks.push(
      <p key={`p-${key++}`} className="my-2 leading-relaxed first:mt-0 last:mb-0">
        {renderInline(text, `p-${key}`)}
      </p>,
    )
    paragraph = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const bullet = line.match(/^[-*]\s+(.*)$/)

    if (heading) {
      flushParagraph()
      flushBullets()
      blocks.push(
        <p key={`h-${key++}`} className="mb-1 mt-3 text-small font-semibold text-foreground first:mt-0">
          {renderInline(heading[2], `h-${key}`)}
        </p>,
      )
    } else if (bullet) {
      flushParagraph()
      bullets.push(bullet[1])
    } else if (line.trim() === '') {
      flushParagraph()
      flushBullets()
    } else {
      flushBullets()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushBullets()

  return <div className="text-body text-foreground">{blocks}</div>
}
