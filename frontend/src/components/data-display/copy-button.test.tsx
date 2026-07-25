import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CopyButton } from './copy-button'

describe('CopyButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('copies the value and shows a confirmation state', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<CopyButton value="https://recall.app/sessions/apollo-launch" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(await screen.findByText('Copied')).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith('https://recall.app/sessions/apollo-launch')
  })
})
