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
    expect(await screen.findByText('Recall Recording Architecture')).toBeInTheDocument()
    expect(screen.getByText('Recall Product Planning')).toBeInTheDocument()
  })

  it('search filters sessions', async () => {
    const user = userEvent.setup()
    renderSessionsPage()
    await screen.findByText('Recall Recording Architecture')

    await user.type(screen.getByPlaceholderText('Search sessions, projects, people...'), 'Recording Architecture')

    expect(screen.getByText('Recall Recording Architecture')).toBeInTheDocument()
    expect(screen.queryByText('Recall Product Planning')).not.toBeInTheDocument()
  })

  it('status filter narrows the list', async () => {
    const user = userEvent.setup()
    renderSessionsPage()
    await screen.findByText('eDiaspora Weekly Planning')

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'ready')

    expect(screen.queryByText('eDiaspora Weekly Planning')).not.toBeInTheDocument()
    expect(screen.getByText('Recall Recording Architecture')).toBeInTheDocument()
  })

  it('opens the session detail route when a row is clicked', async () => {
    const user = userEvent.setup()
    renderSessionsPage()
    await screen.findByText('Recall Recording Architecture')

    await user.click(screen.getByText('Recall Recording Architecture'))

    expect(await screen.findByText('Session detail placeholder')).toBeInTheDocument()
  })

  it('shows an empty state with no workspace data', async () => {
    deleteWorkspaceData()
    renderSessionsPage()
    expect(await screen.findByText('No sessions yet')).toBeInTheDocument()
  })
})
