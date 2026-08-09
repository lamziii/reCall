import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, Square, Mic, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceInput } from '@/lib/ai/use-voice-input'

const MAX_HEIGHT = 200 // ~8 lines before internal scroll

export function RecallAiComposer({
  onSend,
  onStop,
  streaming,
  autoFocus = true,
  disclaimer = true,
}: {
  onSend: (text: string) => void
  onStop: () => void
  streaming: boolean
  autoFocus?: boolean
  disclaimer?: boolean
}) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  // Voice input drops transcribed text into the composer (appended to whatever's already typed).
  const appendTranscript = useCallback((text: string) => {
    setValue((v) => (v ? `${v.trimEnd()} ${text}` : text))
    requestAnimationFrame(() => ref.current?.focus())
  }, [])
  const voice = useVoiceInput(appendTranscript)
  const recording = voice.state === 'recording'
  const transcribing = voice.state === 'transcribing'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || streaming) return
    onSend(text)
    setValue('')
  }

  const canSend = value.trim().length > 0 && !streaming

  const placeholder = recording ? 'Listening… tap the mic to stop' : transcribing ? 'Transcribing…' : 'Message Recall AI…'

  return (
    <div className="bg-bg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-[1.75rem] border border-border bg-surface px-3 py-2.5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.3)] transition-fast focus-within:border-border-strong">
          <textarea
            ref={ref}
            value={value}
            rows={1}
            autoFocus={autoFocus}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={placeholder}
            aria-label="Message Recall AI"
            className="max-h-[200px] flex-1 resize-none self-center bg-transparent px-1.5 py-1 text-body leading-relaxed text-foreground outline-none placeholder:text-subtle-foreground"
          />

          {/* Voice input — hidden when the runtime can't record. Toggles record → stop → transcribe. */}
          {voice.supported && !streaming && (
            <button
              type="button"
              onClick={() => (recording ? void voice.stop() : void voice.start())}
              disabled={transcribing}
              aria-label={recording ? 'Stop recording' : 'Record a voice message'}
              aria-pressed={recording}
              title={voice.error ?? (recording ? 'Stop recording' : 'Voice input')}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full transition-fast active:scale-95',
                recording
                  ? 'focus-ring bg-danger text-danger-foreground hover:opacity-80'
                  : transcribing
                    ? 'cursor-default text-subtle-foreground'
                    : 'focus-ring text-subtle-foreground hover:bg-surface-hover hover:text-foreground',
              )}
            >
              {transcribing ? (
                <Loader2 className="size-4.5 animate-spin" />
              ) : recording ? (
                <Square className="size-3.5 fill-current" />
              ) : (
                <Mic className="size-4.5" />
              )}
            </button>
          )}

          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-bg transition-fast hover:opacity-80 active:scale-95"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full transition-fast active:scale-95',
                canSend
                  ? 'focus-ring bg-foreground text-bg hover:opacity-80'
                  : 'cursor-not-allowed bg-surface-active text-disabled-foreground',
              )}
            >
              <ArrowUp className="size-4.5" strokeWidth={2.25} />
            </button>
          )}
        </div>
        {disclaimer && (
          <p className="mt-2 text-center text-caption text-subtle-foreground">
            Recall AI can make mistakes. Check important details against the source.
          </p>
        )}
      </div>
    </div>
  )
}
