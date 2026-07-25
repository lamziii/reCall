import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabList, Tab, TabPanel } from './tabs'

function Example() {
  return (
    <Tabs defaultValue="summary">
      <TabList>
        <Tab value="summary">Executive Summary</Tab>
        <Tab value="decisions">Decisions</Tab>
      </TabList>
      <TabPanel value="summary">Summary content</TabPanel>
      <TabPanel value="decisions">Decisions content</TabPanel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('moves focus with ArrowRight and activates the focused tab on Enter', async () => {
    const user = userEvent.setup()
    render(<Example />)

    const summaryTab = screen.getByRole('tab', { name: 'Executive Summary' })
    const decisionsTab = screen.getByRole('tab', { name: 'Decisions' })

    summaryTab.focus()
    expect(screen.getByText('Summary content')).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(decisionsTab).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(decisionsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Decisions content')).toBeInTheDocument()
    expect(screen.queryByText('Summary content')).not.toBeInTheDocument()
  })
})
