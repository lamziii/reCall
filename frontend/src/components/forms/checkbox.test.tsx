import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('toggles via keyboard (Tab then Space)', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Auto-record" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Auto-record' })

    await user.tab()
    expect(checkbox).toHaveFocus()
    expect(checkbox).not.toBeChecked()

    await user.keyboard(' ')
    expect(checkbox).toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Auto-record" disabled onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Auto-record' })
    await userEvent.click(checkbox, { pointerEventsCheck: 0 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('sets the indeterminate DOM property', () => {
    render(<Checkbox label="Select all" indeterminate />)
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement
    expect(checkbox.indeterminate).toBe(true)
  })
})
