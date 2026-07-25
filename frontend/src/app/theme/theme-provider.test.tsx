import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme, STORAGE_KEY } from './theme-provider'

function stubMatchMedia(prefersDark: boolean) {
  let current = prefersDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query === '(prefers-color-scheme: dark)' ? current : false
    },
    media: query,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  }))
  return {
    fireChange(matches: boolean) {
      current = matches
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent))
    },
  }
}

function Probe() {
  const { preference, resolvedTheme, setPreference } = useTheme()
  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setPreference('light')}>Use light</button>
      <button onClick={() => setPreference('dark')}>Use dark</button>
      <button onClick={() => setPreference('system')}>Use system</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-ready')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults to system when nothing is stored', () => {
    stubMatchMedia(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('preference')).toHaveTextContent('system')
  })

  it('loads a saved light preference', () => {
    stubMatchMedia(true) // OS says dark — saved preference should still win
    localStorage.setItem(STORAGE_KEY, 'light')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('preference')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('loads a saved dark preference', () => {
    stubMatchMedia(false)
    localStorage.setItem(STORAGE_KEY, 'dark')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('preference')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('selecting Light updates the root attribute and persists to localStorage', async () => {
    stubMatchMedia(false)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Use light'))

    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('selecting Dark updates the root attribute and persists to localStorage', async () => {
    stubMatchMedia(true)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Use dark'))

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('selecting System follows the current matchMedia result', async () => {
    stubMatchMedia(true)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Use light'))
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')

    await user.click(screen.getByText('Use system'))
    expect(screen.getByTestId('preference')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    // The stored value must be the preference itself, not the resolved theme.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('system')
  })

  it('reacts live when the OS theme changes while preference is system', async () => {
    const media = stubMatchMedia(false)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Use system'))
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')

    act(() => media.fireChange(true))

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    // Still "system" — a live OS change must never overwrite the saved preference.
    expect(screen.getByTestId('preference')).toHaveTextContent('system')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('system')
  })
})
