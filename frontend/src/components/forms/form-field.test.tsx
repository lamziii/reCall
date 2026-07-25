import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from './form-field'
import { Input } from './input'

describe('FormField', () => {
  it('associates the label with the control via htmlFor/id', () => {
    render(
      <FormField label="Work email">{(field) => <Input {...field} />}</FormField>,
    )
    // getByLabelText only succeeds if <label htmlFor> and the input's id match.
    expect(screen.getByLabelText('Work email')).toBeInTheDocument()
  })

  it('wires the error message into aria-describedby and marks aria-invalid', () => {
    render(
      <FormField label="Work email" error="Enter a valid email address">
        {(field) => <Input {...field} error />}
      </FormField>,
    )
    const input = screen.getByLabelText('Work email')
    expect(input).toHaveAttribute('aria-invalid', 'true')

    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const message = document.getElementById(describedBy!.split(' ')[0])
    expect(message).toHaveTextContent('Enter a valid email address')
    expect(message).toHaveAttribute('role', 'alert')
  })

  it('renders the character count when provided', () => {
    render(
      <FormField label="Note" characterCount={{ current: 12, max: 280 }}>
        {(field) => <Input {...field} />}
      </FormField>,
    )
    expect(screen.getByText('12/280')).toBeInTheDocument()
  })
})
