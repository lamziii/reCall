import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from './combobox'

const OPTIONS = [
  { value: 'apollo', label: 'Apollo Launch' },
  { value: 'onboarding', label: 'Onboarding Redesign' },
]

describe('Combobox', () => {
  it('filters options while typing and selects the active one with Enter', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Combobox options={OPTIONS} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.type(input, 'Onboard')

    expect(await screen.findByText('Onboarding Redesign')).toBeInTheDocument()
    expect(screen.queryByText('Apollo Launch')).not.toBeInTheDocument()

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('onboarding')
  })

  it('shows a no-results state for an unmatched query', async () => {
    const user = userEvent.setup()
    render(<Combobox options={OPTIONS} />)
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.type(input, 'zzz')
    expect(await screen.findByText('No results')).toBeInTheDocument()
  })
})
