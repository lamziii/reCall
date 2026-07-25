import { useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/button'
import { fade, slideUp, scaleIn, staggerContainer, staggerItem, hoverLift } from '@/styles/animations'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

function ReplayDemo({ label, children }: { label: string; children: (key: number) => ReactNode }) {
  const [key, setKey] = useState(0)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-border bg-surface">{children(key)}</div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-caption text-muted-foreground">{label}</span>
        <IconButton icon={<RotateCcw />} label="Replay" size="sm" variant="ghost" className="size-6" onClick={() => setKey((k) => k + 1)} />
      </div>
    </div>
  )
}

export function MotionSection() {
  return (
    <PlaygroundSection
      id="motion"
      title="Motion"
      description="Shared Framer Motion presets from styles/animations — fast, subtle, no bounce. Click replay to re-trigger."
    >
      <PlaygroundRow>
        <ReplayDemo label="fade">
          {(key) => (
            <motion.div key={key} variants={fade} initial="initial" animate="animate" className="size-10 rounded-md bg-accent" />
          )}
        </ReplayDemo>

        <ReplayDemo label="slideUp">
          {(key) => (
            <motion.div key={key} variants={slideUp} initial="initial" animate="animate" className="size-10 rounded-md bg-accent" />
          )}
        </ReplayDemo>

        <ReplayDemo label="scaleIn">
          {(key) => (
            <motion.div key={key} variants={scaleIn} initial="initial" animate="animate" className="size-10 rounded-md bg-accent" />
          )}
        </ReplayDemo>

        <ReplayDemo label="stagger">
          {(key) => (
            <motion.div key={key} variants={staggerContainer} initial="initial" animate="animate" className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} variants={staggerItem} className="size-6 rounded bg-accent" />
              ))}
            </motion.div>
          )}
        </ReplayDemo>

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-border bg-surface">
            <motion.div {...hoverLift}>
              <Button size="sm">Hover me</Button>
            </motion.div>
          </div>
          <span className="font-mono text-caption text-muted-foreground">hoverLift</span>
        </div>
      </PlaygroundRow>

      <p className="max-w-2xl text-small text-muted-foreground">
        Dialog, drawer, dropdown, tooltip and page-transition presets are demonstrated live in the Overlays section above — every
        overlay in this system animates with the same <code className="font-mono text-caption">dialogContent</code> /{' '}
        <code className="font-mono text-caption">scaleIn</code> curve for consistency.
      </p>
    </PlaygroundSection>
  )
}
