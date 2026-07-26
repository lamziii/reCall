import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ReviewsPage } from './reviews'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { deleteWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { ToastProvider } from '@/components/feedback/toast'

function renderReviews() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/app/reviews']}>
        <ReviewsPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ReviewsPage', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('lists sessions that need review', async () => {
    renderReviews()
    expect(await screen.findByText('Recall Product Planning')).toBeInTheDocument()
  })

  it('filters by search', async () => {
    const user = userEvent.setup()
    renderReviews()
    await screen.findByText('Recall Product Planning')

    await user.type(screen.getByPlaceholderText('Search reviews...'), 'zzz-no-match')
    expect(await screen.findByText('No reviews match your filters')).toBeInTheDocument()
  })

  it('approving a review updates its status in the table', async () => {
    const user = userEvent.setup()
    renderReviews()
    const row = (await screen.findByText('Recall Product Planning')).closest('tr')!

    await user.click(within(row).getByRole('button', { name: 'Open' }))
    await user.click(await screen.findByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('Review approved')).toBeInTheDocument()
  })
})
