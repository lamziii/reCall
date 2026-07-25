import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/feedback'
import { Label, Small } from '@/components/typography'
import { seedDummyData, clearSampleData, hasSampleData } from '@/data/sample/sample-data-service'
import { APP_BASE } from '@/app/shell/nav-config'

/** Dev-only workspace seeding for exercising the Home dashboard with realistic data. Never rendered in production — see the import.meta.env.DEV guard in SettingsPage. */
export function DeveloperToolsSection() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [generateOpen, setGenerateOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [sampleExists, setSampleExists] = useState(() => hasSampleData())

  async function handleGenerate() {
    setGenerating(true)
    try {
      await seedDummyData()
      setSampleExists(true)
      setGenerateOpen(false)
      toast({
        title: 'Sample workspace created',
        description: 'Recall now contains realistic data for testing the Home dashboard and product flows.',
        variant: 'success',
      })
      navigate(APP_BASE)
    } finally {
      setGenerating(false)
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clearSampleData()
      setSampleExists(false)
      setClearOpen(false)
      toast({ title: 'Sample data removed', variant: 'success' })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5 border-b border-border-subtle pb-8">
      <Label as="span">Developer tools</Label>
      <Small className="text-muted-foreground">Generate realistic sample workspace data for testing Recall's product experience.</Small>

      <div className="mt-1.5 flex items-center gap-2">
        <Button size="sm" onClick={() => setGenerateOpen(true)}>
          Generate sample data
        </Button>
        <Button size="sm" variant="secondary" disabled={!sampleExists} onClick={() => setClearOpen(true)}>
          Clear sample data
        </Button>
      </div>

      <ConfirmDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        title="Generate sample workspace?"
        description="This will create realistic sessions, projects, decisions, tasks, people, and meeting activity for design and product testing. Existing data will not be changed."
        confirmLabel={generating ? 'Generating sample data…' : 'Generate sample data'}
        onConfirm={handleGenerate}
        loading={generating}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear sample workspace data?"
        description="This removes only development sample records. Your own workspace data will remain unchanged."
        confirmLabel="Clear sample data"
        onConfirm={handleClear}
        loading={clearing}
        variant="danger"
      />
    </div>
  )
}
