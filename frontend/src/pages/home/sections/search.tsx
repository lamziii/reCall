import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'
import { SearchDemo } from '../visuals/search-demo'

export function SearchSection() {
  return (
    <SectionShell
      id="search"
      align="center"
      eyebrow="How teams use it"
      title="Ask your organization anything."
      description="Every meeting your team has ever had becomes one searchable memory. Ask in plain language and get answers — with the decisions, tasks, and people behind them."
    >
      <Reveal>
        <div className="mx-auto max-w-2xl">
          <SearchDemo />
        </div>
      </Reveal>
    </SectionShell>
  )
}
