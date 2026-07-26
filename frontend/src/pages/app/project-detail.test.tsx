import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProjectDetailPage } from './project-detail'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { PROJECT_IDS } from '@/data/sample/sample-projects'
import { deleteWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { ToastProvider } from '@/components/feedback/toast'

function renderProjectDetail(projectId: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/app/projects/${projectId}`]}>
        <Routes>
          <Route path="/app/projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('renders the summary, sessions, decisions, and tasks for a project', async () => {
    renderProjectDetail(PROJECT_IDS.recall)

    expect(await screen.findByRole('heading', { name: 'Recall' })).toBeInTheDocument()
    expect(screen.getByText('AI summary')).toBeInTheDocument()
    expect(screen.getAllByText('Recall Product Planning').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ship the Session Review page before polishing the dashboard.').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Status for Finish the Session Review page layout')).toBeInTheDocument()
  })

  it('switches tabs', async () => {
    const user = userEvent.setup()
    renderProjectDetail(PROJECT_IDS.recall)
    await screen.findByText('AI summary')

    await user.click(screen.getByRole('tab', { name: 'Members' }))

    expect(screen.queryByText('AI summary')).not.toBeInTheDocument()
  })

  it('changing a task status updates the select', async () => {
    const user = userEvent.setup()
    renderProjectDetail(PROJECT_IDS.recall)

    const select = (await screen.findByLabelText('Status for Finish the Session Review page layout')) as HTMLSelectElement
    await user.selectOptions(select, 'done')

    expect(select.value).toBe('done')
  })

  it('shows a not-found state for an unknown project id', async () => {
    renderProjectDetail('does-not-exist')
    expect(await screen.findByText('Project not found')).toBeInTheDocument()
  })
})
