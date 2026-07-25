import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionsPage } from './sessions'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { deleteWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { ToastProvider } from '@/components/feedback/toast'

function renderSessionsPage() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/app/sessions']}>
        <Routes>
          <Route path="/app/sessions" element={<SessionsPage />} />
          <Route path="/app/sessions/:sessionId" element={<div>Session detail placeholder</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('SessionsPage', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('renders sample sessions', async () => {
    renderSessionsPage()
    expect(await screen.findByText('Platform Reliability Retrospective')).toBeInTheDocument()
    expect(screen.getByText('Q3 Product Strategy Sync')).toBeInTheDocument()
  })

  it('search filters sessions', async () => {
    const user = userEvent.setup()
    renderSessionsPage()
    await screen.findByText('Platform Reliability Retrospective')

    await user.type(screen.getByPlaceholderText('Search sessions, projects, people...'), 'Reliability Retrospective')

    expect(screen.getByText('Platform Reliability Retrospective')).toBeInTheDocument()
    expect(screen.queryByText('Q3 Product Strategy Sync')).not.toBeInTheDocument()
  })

  it('status filter narrows the list', async () => {
    const user = userEvent.setup()
    renderSessionsPage()
    await screen.findByText('Weekly Engineering Standup')

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'ready')

    expect(screen.queryByText('Weekly Engineering Standup')).not.toBeInTheDocument()
    expect(screen.getByText('Platform Reliability Retrospective')).toBeInTheDocument()
  })

  it('opens the session detail route when a row is clicked', async () => {
    const user = userEvent.setup()
    renderSessionsPage()
    await screen.findByText('Platform Reliability Retrospective')

    await user.click(screen.getByText('Platform Reliability Retrospective'))

    expect(await screen.findByText('Session detail placeholder')).toBeInTheDocument()
  })

  it('shows an empty state with no workspace data', async () => {
    deleteWorkspaceData()
    renderSessionsPage()
    expect(await screen.findByText('No sessions yet')).toBeInTheDocument()
  })
})
