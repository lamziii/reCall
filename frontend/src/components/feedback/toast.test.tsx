import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './toast'

function Trigger() {
  const { toast } = useToast()
  return (
    <button onClick={() => toast({ title: 'Session deleted', variant: 'danger' })}>Delete</button>
  )
}

describe('Toast', () => {
  it('renders inside a live region so screen readers announce it', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    const toastText = await screen.findByText('Session deleted')
    const liveRegion = toastText.closest('[aria-live]')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })

  it('dismisses when the close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await screen.findByText('Session deleted')

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    await waitFor(() => expect(screen.queryByText('Session deleted')).not.toBeInTheDocument())
  })
})
