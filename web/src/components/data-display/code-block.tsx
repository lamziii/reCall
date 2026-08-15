import { cn } from '@/lib/utils'
import { CopyButton } from './copy-button'

export interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  wrap?: boolean
  className?: string
}

/** Plain monospace block — no syntax highlighting (would need a highlighter dependency; postponed, see components/README.md). */
export function CodeBlock({ code, language, filename, wrap, className }: CodeBlockProps) {
  return (
    <div className={cn('recall-code overflow-hidden rounded-lg border border-border bg-surface', className)}>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <span className="text-caption text-muted-foreground">{filename ?? language ?? 'Code'}</span>
        <CopyButton value={code} />
      </div>
      <pre className={cn('overflow-x-auto p-4 text-code font-mono text-foreground', wrap && 'whitespace-pre-wrap break-words')}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
