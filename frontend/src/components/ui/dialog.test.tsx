import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog'

describe('Dialog', () => {
  it('opens on trigger click, closes on Escape, and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>
          <button>Open dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete session?</DialogTitle>
        </DialogContent>
      </Dialog>,
    )

    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(trigger)

    expect(await screen.findByText('Delete session?')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByText('Delete session?')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
