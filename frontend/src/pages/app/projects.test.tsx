import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProjectsPage } from './projects'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { deleteWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { ToastProvider } from '@/components/feedback/toast'

function renderProjectsPage() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/app/projects']}>
        <Routes>
          <Route path="/app/projects" element={<ProjectsPage />} />
          <Route path="/app/projects/:projectId" element={<div>Project detail placeholder</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('renders sample projects', async () => {
    renderProjectsPage()
    expect(await screen.findByText('Studo')).toBeInTheDocument()
    expect(screen.getByText('eDiaspora')).toBeInTheDocument()
  })

  it('search filters projects', async () => {
    const user = userEvent.setup()
    renderProjectsPage()
    await screen.findByText('Studo')

    await user.type(screen.getByPlaceholderText('Search projects...'), 'Studo')

    expect(screen.getByText('Studo')).toBeInTheDocument()
    expect(screen.queryByText('eDiaspora')).not.toBeInTheDocument()
  })

  it('status filter narrows the list', async () => {
    const user = userEvent.setup()
    renderProjectsPage()
    await screen.findByText('Game Zone')

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'archived')

    expect(screen.getByText('Game Zone')).toBeInTheDocument()
    expect(screen.queryByText('Studo')).not.toBeInTheDocument()
  })

  it('switches between grid and list view', async () => {
    const user = userEvent.setup()
    renderProjectsPage()
    await screen.findByText('Studo')

    await user.click(screen.getByRole('radio', { name: 'List' }))

    expect(screen.getByText('Studo')).toBeInTheDocument()
  })

  it('opens the project detail route when a card is clicked', async () => {
    const user = userEvent.setup()
    renderProjectsPage()
    await screen.findByText('Studo')

    await user.click(screen.getByText('Studo'))

    expect(await screen.findByText('Project detail placeholder')).toBeInTheDocument()
  })

  it('shows an empty state with no workspace data', async () => {
    deleteWorkspaceData()
    renderProjectsPage()
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
  })
})
