import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionReviewPage } from './session-detail'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { SESSION_IDS } from '@/data/sample/sample-sessions'
import { deleteWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { ToastProvider } from '@/components/feedback/toast'

function renderSessionDetail(sessionId: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/app/sessions/${sessionId}`]}>
        <Routes>
          <Route path="/app/sessions/:sessionId" element={<SessionReviewPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('SessionReviewPage', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('renders the summary, decisions, and tasks for a session', async () => {
    renderSessionDetail(SESSION_IDS.recallProductPlanning)

    expect(await screen.findByText('Recall Product Planning')).toBeInTheDocument()
    expect(screen.getByText('Executive summary')).toBeInTheDocument()
    expect(screen.getByText('Ship the Session Review page before polishing the dashboard.')).toBeInTheDocument()
    expect(screen.getByText('Finish the Session Review page layout')).toBeInTheDocument()
  })

  it('switches tabs', async () => {
    const user = userEvent.setup()
    renderSessionDetail(SESSION_IDS.recallProductPlanning)
    await screen.findByText('Executive summary')

    await user.click(screen.getByRole('tab', { name: 'Transcript' }))

    expect(screen.getByPlaceholderText('Search transcript...')).toBeInTheDocument()
    expect(screen.queryByText('Executive summary')).not.toBeInTheDocument()
  })

  it('changing a task status updates the select', async () => {
    const user = userEvent.setup()
    renderSessionDetail(SESSION_IDS.recallProductPlanning)
    await screen.findByText('Finish the Session Review page layout')

    const select = screen.getByLabelText('Status for Finish the Session Review page layout') as HTMLSelectElement
    await user.selectOptions(select, 'done')

    expect(select.value).toBe('done')
  })

  it('shows a not-found state for an unknown session id', async () => {
    renderSessionDetail('does-not-exist')
    expect(await screen.findByText('Session not found')).toBeInTheDocument()
  })
})
