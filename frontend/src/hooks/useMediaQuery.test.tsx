import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

function ReducedMotionProbe() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  return <span>{prefersReducedMotion ? 'reduced' : 'full'}</span>
}

describe('useMediaQuery — reduced motion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports reduced motion when the media query matches', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))

    render(<ReducedMotionProbe />)
    expect(screen.getByText('reduced')).toBeInTheDocument()
  })

  it('reports full motion when the media query does not match', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))

    render(<ReducedMotionProbe />)
    expect(screen.getByText('full')).toBeInTheDocument()
  })
})
