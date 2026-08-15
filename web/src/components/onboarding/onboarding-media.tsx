import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { OnboardingPreview } from './onboarding-previews'
import type { OnboardingMediaSpec } from '@/lib/onboarding/tutorial-config'

/**
 * The tour's media area. Renders a themed placeholder preview today; swapping a step's `media` to
 * `{ type: 'video', src, poster }` (or `image`) works with no layout change (spec §6/§35). Videos
 * autoplay muted/looped/inline with no controls, pause when the step isn't active, and resume
 * cleanly when revisited. Honors prefers-reduced-motion by not autoplaying.
 */
export function OnboardingMedia({ media, active }: { media: OnboardingMediaSpec; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const ratio = media.aspectRatio ?? 16 / 9

  useEffect(() => {
    const el = videoRef.current
    if (!el || media.type !== 'video') return
    if (active && !reduce) {
      el.currentTime = 0
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [active, reduce, media.type])

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-surface"
      style={{ aspectRatio: String(ratio) }}
    >
      {media.type === 'video' && media.src ? (
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={media.alt}
          className="size-full object-cover"
        />
      ) : media.type === 'image' && media.src ? (
        <img src={media.src} alt={media.alt} className="size-full object-cover" />
      ) : (
        <OnboardingPreview kind={media.placeholder ?? 'welcome'} />
      )}
    </div>
  )
}
