import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './theme-provider'
import { ThemeToggle } from './theme-toggle'

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

/** Stand-in for the Settings page's segmented control — proves both surfaces share one ThemeProvider. */
function SettingsProbe() {
  const { preference } = useTheme()
  return <span data-testid="settings-preference">{preference}</span>
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has an accessible name reflecting the current mode', () => {
    stubMatchMedia(false)
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /appearance: system/i })).toBeInTheDocument()
  })

  it('opens the menu and marks the active option with a check icon, via keyboard', async () => {
    stubMatchMedia(false)
    localStorage.setItem('recall-theme', 'dark')
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    screen.getByRole('button', { name: /appearance/i }).focus()
    await user.keyboard('{Enter}')

    const dark = await screen.findByRole('menuitem', { name: /dark/i })
    expect(dark.querySelector('svg')).toBeInTheDocument() // check icon rendered next to the active option
  })

  it('selecting an option in the menu updates state shared with other consumers (e.g. Settings)', async () => {
    stubMatchMedia(false)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
        <SettingsProbe />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: /appearance/i }))
    await user.click(await screen.findByRole('menuitem', { name: /^light/i }))

    expect(screen.getByTestId('settings-preference')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('returns focus to the trigger after the menu closes', async () => {
    stubMatchMedia(false)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const trigger = screen.getByRole('button', { name: /appearance/i })
    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })
})
