import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Clock, DollarSign, Languages, Upload, Users } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/data-display/card'
import { Badge } from '@/components/data-display/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/forms/select'
import { Switch } from '@/components/forms/switch'
import { Input } from '@/components/forms/input'
import { ErrorState } from '@/components/feedback/error-state'
import {
  BenchmarkError,
  runTranscriptionBenchmark,
  type BenchmarkResult,
  type TranscriptionProviderName,
} from '@/lib/firebase/benchmark'
import type { SessionSpeaker, TranscriptSegment } from '@/data/live/types'

// Internal-only tool: upload ONE audio file, transcribe it with every selected provider, and
// compare Albanian / mixed-language / diarization quality side by side before we pick a provider.
// Provider API keys live server-side; this page only talks to the benchmarkTranscription function.

const ALL_PROVIDERS: { name: TranscriptionProviderName; label: string; note: string }[] = [
  { name: 'openai', label: 'OpenAI', note: 'gpt-4o-transcribe · no diarization' },
  { name: 'speechmatics', label: 'Speechmatics', note: 'Albanian + speaker diarization' },
]

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'sq', label: 'Albanian (sq)' },
  { value: 'en', label: 'English (en)' },
]

/** Turns diarized segments into "Speaker N: …" lines, merging consecutive same-speaker turns. */
function labeledLines(segments: TranscriptSegment[], speakers: SessionSpeaker[]): { label: string; text: string }[] {
  const byLabel = new Map(speakers.map((s) => [s.label, s.displayName?.trim() || s.label]))
  const lines: { label: string; text: string }[] = []
  for (const seg of segments) {
    const label = byLabel.get(seg.speakerLabel) || seg.speakerLabel || 'Speaker'
    const last = lines[lines.length - 1]
    if (last && last.label === label) last.text += ` ${seg.text}`
    else lines.push({ label, text: seg.text })
  }
  return lines
}

function fmtDuration(sec?: number): string {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-caption text-muted-foreground [&>svg]:size-3">
        {icon}
        {label}
      </span>
      <span className="text-small font-medium text-foreground">{value}</span>
    </div>
  )
}

function ResultCard({ result }: { result: BenchmarkResult }) {
  const lines = result.segments.length ? labeledLines(result.segments, result.speakers) : null
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="capitalize">{result.provider}</CardTitle>
        {result.diarized ? (
          <Badge variant="accent" icon={<Users />}>
            {result.speakers.length} speaker{result.speakers.length === 1 ? '' : 's'}
          </Badge>
        ) : (
          <Badge variant="outline">No diarization</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={<Languages />} label="Language" value={result.detectedLanguage || 'auto'} />
          <Metric icon={<Clock />} label="Audio" value={fmtDuration(result.durationSeconds)} />
          <Metric icon={<Clock />} label="Processing" value={`${(result.processingTimeMs / 1000).toFixed(1)}s`} />
          <Metric icon={<DollarSign />} label="Est. cost" value={result.estimatedCost != null ? `$${result.estimatedCost.toFixed(4)}` : '—'} />
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface p-3">
          {lines ? (
            <div className="flex flex-col gap-2 text-small leading-relaxed">
              {lines.map((line, i) => (
                <p key={i}>
                  <span className="font-semibold text-accent">{line.label}: </span>
                  <span className="text-foreground">{line.text}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-small leading-relaxed text-foreground">{result.text || '(no speech detected)'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TranscriptionBenchmarkPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [selected, setSelected] = useState<Record<TranscriptionProviderName, boolean>>({ openai: true, speechmatics: true })
  const [language, setLanguage] = useState('auto')
  const [diarization, setDiarization] = useState(true)
  const [expectedSpeakers, setExpectedSpeakers] = useState<number | undefined>(undefined)

  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<BenchmarkResult[]>([])
  const [providerErrors, setProviderErrors] = useState<Array<{ provider: string; error: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const chosen = useMemo(() => ALL_PROVIDERS.filter((p) => selected[p.name]).map((p) => p.name), [selected])

  async function handleRun() {
    if (!file || chosen.length === 0) return
    setRunning(true)
    setError(null)
    setResults([])
    setProviderErrors([])
    try {
      const res = await runTranscriptionBenchmark(file, {
        providers: chosen,
        language: language as 'sq' | 'en' | 'auto',
        enableDiarization: diarization,
        expectedSpeakers,
      })
      setResults(res.results)
      setProviderErrors(res.errors)
    } catch (err) {
      setError(err instanceof BenchmarkError ? err.message : 'Something went wrong running the benchmark.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Transcription benchmark"
        description="Internal tool — run one audio file through multiple providers and compare Albanian, mixed-language, and diarization quality."
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-6 pt-5">
            {/* File picker */}
            <div className="flex flex-col gap-2">
              <span className="text-small font-medium text-foreground">Audio file</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-3">
                <Button variant="secondary" leftIcon={<Upload />} onClick={() => fileInputRef.current?.click()}>
                  Choose file
                </Button>
                <span className="text-small text-muted-foreground">
                  {file ? `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'No file selected'}
                </span>
              </div>
            </div>

            {/* Providers */}
            <div className="flex flex-col gap-2">
              <span className="text-small font-medium text-foreground">Providers</span>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {ALL_PROVIDERS.map((p) => (
                  <Switch
                    key={p.name}
                    checked={selected[p.name]}
                    onChange={(e) => setSelected((s) => ({ ...s, [p.name]: e.target.checked }))}
                    label={p.label}
                    description={p.note}
                  />
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-small font-medium text-foreground">Language</span>
                <Select options={LANGUAGE_OPTIONS} value={language} onChange={(e) => setLanguage(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-small font-medium text-foreground">Expected speakers</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  placeholder="Auto"
                  value={expectedSpeakers ?? ''}
                  onChange={(e) => setExpectedSpeakers(e.target.value ? Number(e.target.value) : undefined)}
                />
              </label>
              <div className="flex items-end">
                <Switch checked={diarization} onChange={(e) => setDiarization(e.target.checked)} label="Speaker diarization" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleRun} loading={running} disabled={!file || chosen.length === 0}>
                {running ? 'Transcribing…' : 'Run benchmark'}
              </Button>
              {chosen.length === 0 && <span className="text-caption text-muted-foreground">Select at least one provider.</span>}
            </div>
          </CardContent>
        </Card>

        {error && (
          <ErrorState title="Benchmark failed" description={error} onRetry={file ? handleRun : undefined} />
        )}

        {providerErrors.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning-muted p-4">
            {providerErrors.map((pe) => (
              <p key={pe.provider} className="flex items-start gap-2 text-small text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold capitalize">{pe.provider}</span>: {pe.error}
                </span>
              </p>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {results.map((r) => (
              <ResultCard key={r.provider} result={r} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
