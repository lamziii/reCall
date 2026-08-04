import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/app/theme/theme-provider'
import { ToastProvider } from '@/components/feedback/toast'
import type { DevelopmentTask } from '@/data/dev-tasks/types'

// ---- Mock the Firestore store; capture the realtime callback so the test can push updates. ----
let emit: (tasks: DevelopmentTask[]) => void = () => {}
const reserveDevTask = vi.fn().mockResolvedValue(undefined)
const createDevTask = vi.fn().mockResolvedValue('new-id')

vi.mock('@/data/dev-tasks/dev-tasks-store', () => ({
  ensureDevTasksSeeded: vi.fn().mockResolvedValue(false),
  subscribeDevTasks: (onData: (t: DevelopmentTask[]) => void) => {
    emit = onData
    return () => {}
  },
  reserveDevTask,
  createDevTask,
  updateDevTask: vi.fn().mockResolvedValue(undefined),
  deleteDevTask: vi.fn().mockResolvedValue(undefined),
  startDevTask: vi.fn().mockResolvedValue(undefined),
  releaseDevTask: vi.fn().mockResolvedValue(undefined),
  completeDevTask: vi.fn().mockResolvedValue(undefined),
  reopenDevTask: vi.fn().mockResolvedValue(undefined),
  takeOverDevTask: vi.fn().mockResolvedValue(undefined),
  DevTaskConflictError: class DevTaskConflictError extends Error {},
}))

// Import AFTER the mock is registered.
const { DevTaskboardPage } = await import('./index')

function task(overrides: Partial<DevelopmentTask>): DevelopmentTask {
  return {
    id: 'id', title: 'A task', description: null, category: 'other', priority: 'medium',
    status: 'backlog', reserved_by: null, created_by: 'system', completed_by: null,
    created_at: null, updated_at: null, reserved_at: null, completed_at: null, order: 0,
    ...overrides,
  }
}

function renderBoard() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={['/tasks']}>
          <DevTaskboardPage />
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  reserveDevTask.mockClear()
  createDevTask.mockClear()
})
afterEach(() => {
  window.localStorage.clear()
})

describe('DevTaskboardPage', () => {
  it('shows the identity popup on first visit', () => {
    renderBoard()
    expect(screen.getByText('Who are you?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Uvejs/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lorik/ })).toBeInTheDocument()
  })

  it('selecting Uvejs closes the popup and shows the user in the header', async () => {
    const user = userEvent.setup()
    renderBoard()
    await user.click(screen.getByRole('button', { name: /Uvejs/ }))
    await waitFor(() => expect(screen.queryByText('Who are you?')).not.toBeInTheDocument())
    expect(window.localStorage.getItem('recall_taskboard_user')).toBe('uvejs')
    expect(screen.getByRole('button', { name: /Switch user/ })).toBeInTheDocument()
  })

  it('remembers the identity after a refresh (no popup)', () => {
    window.localStorage.setItem('recall_taskboard_user', 'lorik')
    renderBoard()
    expect(screen.queryByText('Who are you?')).not.toBeInTheDocument()
  })

  it('can switch users back to the popup', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('recall_taskboard_user', 'uvejs')
    renderBoard()
    await user.click(screen.getByRole('button', { name: /Switch user/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Switch user' }))
    expect(await screen.findByText('Who are you?')).toBeInTheDocument()
  })

  it('renders realtime task updates from the subscription', async () => {
    window.localStorage.setItem('recall_taskboard_user', 'uvejs')
    renderBoard()
    act(() => emit([task({ id: 'a', title: 'Migrate Projects to Firestore' })]))
    expect(await screen.findByText('Migrate Projects to Firestore')).toBeInTheDocument()

    // A live update from the other developer appears without any user action.
    act(() => emit([task({ id: 'a', title: 'Migrate Projects to Firestore' }), task({ id: 'b', title: 'Build Search' })]))
    expect(await screen.findByText('Build Search')).toBeInTheDocument()
  })

  it('reserves a task for the current user', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('recall_taskboard_user', 'uvejs')
    renderBoard()
    act(() => emit([task({ id: 'a', title: 'Reserve me', status: 'backlog' })]))
    const row = (await screen.findByText('Reserve me')).closest('div')!.parentElement!.parentElement!
    await user.click(within(row).getByRole('button', { name: 'Reserve' }))
    await waitFor(() => expect(reserveDevTask).toHaveBeenCalledWith('a', 'uvejs'))
  })

  it("shows a disabled 'Reserved by' state for the other person's task", async () => {
    window.localStorage.setItem('recall_taskboard_user', 'uvejs')
    renderBoard()
    act(() => emit([task({ id: 'a', title: 'Lorik task', status: 'reserved', reserved_by: 'lorik' })]))
    expect(await screen.findByRole('button', { name: /Reserved by Lorik/ })).toBeDisabled()
  })
})
