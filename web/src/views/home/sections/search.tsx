import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'
import { SearchDemo } from '../visuals/search-demo'

export function SearchSection() {
  return (
    <SectionShell
      id="search"
      align="center"
      eyebrow="Retrieval"
      title="Ask your organization anything."
      description="Plain-language questions, answered from every meeting you've ever had."
    >
      <Reveal className="mx-auto max-w-2xl">
        <SearchDemo />
      </Reveal>
    </SectionShell>
  )
}
