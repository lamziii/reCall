import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Rocket,
  Mic,
  Sparkles,
  CheckSquare,
  Calendar,
  Users,
  CreditCard,
  ShieldCheck,
  SearchX,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/data-display/card'
import { Badge } from '@/components/data-display/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/navigation/accordion'
import { SearchInput } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SupportDialog } from '@/components/help/support-dialog'
import { HELP_CATEGORIES, searchHelpArticles } from '@/data/help/help-content'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'getting-started': Rocket,
  recording: Mic,
  'session-review': Sparkles,
  'tasks-projects': CheckSquare,
  calendar: Calendar,
  'teams-people': Users,
  billing: CreditCard,
  'account-security': ShieldCheck,
}

function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = CATEGORY_ICONS[id] ?? Sparkles
  return <Icon className={className} strokeWidth={1.75} aria-hidden />
}

export function HelpPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const reduce = useReducedMotion()

  const matched = useMemo(() => searchHelpArticles(query), [query])
  const results = activeCategory ? matched.filter((c) => c.id === activeCategory) : matched
  const articleCount = matched.reduce((n, c) => n + c.articles.length, 0)
  const hasResults = results.length > 0

  function clearFilters() {
    setQuery('')
    setActiveCategory(null)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Help Center"
        description="Answers to common questions about recording, AI reviews, tasks, and your workspace."
      />

      <div className="mb-5 flex flex-col gap-3">
        <div className="max-w-md">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            placeholder="Search help articles..."
            aria-label="Search help articles"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              'focus-ring transition-fast rounded-full px-3 py-1 text-caption font-medium',
              activeCategory === null
                ? 'bg-accent text-accent-foreground'
                : 'border border-border bg-surface-raised text-muted-foreground hover:bg-surface-hover hover:text-foreground',
            )}
          >
            All topics
          </button>
          {HELP_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory((current) => (current === category.id ? null : category.id))}
              className={cn(
                'focus-ring transition-fast inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium',
                activeCategory === category.id
                  ? 'bg-accent text-accent-foreground'
                  : 'border border-border bg-surface-raised text-muted-foreground hover:bg-surface-hover hover:text-foreground',
              )}
            >
              <CategoryIcon id={category.id} className="size-3" />
              {category.label}
            </button>
          ))}
        </div>

        <p className="text-caption text-subtle-foreground">
          {articleCount} article{articleCount === 1 ? '' : 's'}
          {activeCategory ? ` in ${HELP_CATEGORIES.find((c) => c.id === activeCategory)?.label}` : ` across ${matched.length} topic${matched.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {hasResults ? (
        <div className={cn('grid grid-cols-1 gap-4', !activeCategory && 'lg:grid-cols-2')}>
          <AnimatePresence initial={false} mode="popLayout">
            {results.map((category, index) => (
              <motion.div
                key={category.id}
                layout={!reduce}
                initial={reduce ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.22, delay: reduce ? 0 : index * 0.04, ease: [0.16, 1, 0.3, 1] } }}
                exit={reduce ? undefined : { opacity: 0, y: -4, transition: { duration: 0.12 } }}
                className="h-fit"
              >
                <Card>
                  <CardHeader className="flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
                        <CategoryIcon id={category.id} className="size-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <CardTitle>{category.label}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="accent" className="shrink-0">
                      {category.articles.length}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="border-t border-border-subtle">
                      {category.articles.map((article) => (
                        <AccordionItem key={article.id} value={article.id}>
                          <AccordionTrigger>{article.question}</AccordionTrigger>
                          <AccordionContent className="max-w-[60ch] pr-8">{article.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-surface-active text-subtle-foreground">
              <SearchX className="size-5" aria-hidden />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-small font-medium text-foreground">No results{query.trim() && ` for "${query}"`}</p>
              <p className="text-small text-muted-foreground">Try a different search, or contact support below.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8 mb-4 border-border-accent bg-accent-muted">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <LifeBuoy className="size-5" aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-small font-medium text-foreground">Still stuck?</p>
              <p className="text-small text-muted-foreground">Send us a message and we'll follow up by email.</p>
            </div>
          </div>
          <Button onClick={() => setSupportOpen(true)}>Contact support</Button>
        </CardContent>
      </Card>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </PageContainer>
  )
}
