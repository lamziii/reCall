import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionStatus } from './session-status'
import { TaskStatus } from './task-status'
import { DecisionStatus } from './decision-status'

describe('Recall status components', () => {
  it('SessionStatus maps every status to a human label', () => {
    render(<SessionStatus status="needs-review" />)
    expect(screen.getByText('Needs review')).toBeInTheDocument()
  })

  it('TaskStatus maps every status to a human label', () => {
    render(<TaskStatus status="in-progress" />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('DecisionStatus maps every status to a human label', () => {
    render(<DecisionStatus status="pending-review" />)
    expect(screen.getByText('Pending review')).toBeInTheDocument()
  })
})
