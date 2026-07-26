import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NotificationsPage } from './notifications'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { deleteWorkspaceData, getWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'

function renderNotifications() {
  return render(
    <MemoryRouter initialEntries={['/app/notifications']}>
      <NotificationsPage />
    </MemoryRouter>,
  )
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    saveWorkspaceData(generateSampleWorkspace('test-batch'))
  })

  afterEach(() => {
    deleteWorkspaceData()
  })

  it('groups notifications and shows an unread indicator', async () => {
    renderNotifications()
    expect(await screen.findByText('Today')).toBeInTheDocument()
    expect(getWorkspaceData()!.notifications.some((n) => !n.read)).toBe(true)
  })

  it('marking all as read clears every unread notification', async () => {
    const user = userEvent.setup()
    renderNotifications()
    await screen.findByText('Today')

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))

    expect(getWorkspaceData()!.notifications.every((n) => n.read)).toBe(true)
  })
})
