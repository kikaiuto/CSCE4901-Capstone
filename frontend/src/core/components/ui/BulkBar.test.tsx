import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BulkAction, BulkBar } from './BulkBar'

describe('BulkBar', () => {
  it('stays hidden when nothing is selected', () => {
    render(
      <BulkBar count={0} onDismiss={vi.fn()}>
        <BulkAction>Confirm</BulkAction>
      </BulkBar>,
    )

    expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
  })

  it('reports how many rows are selected', () => {
    render(
      <BulkBar count={2} onDismiss={vi.fn()}>
        <BulkAction>Confirm</BulkAction>
      </BulkBar>,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/selected/)).toBeInTheDocument()
  })

  it('clears the selection from the escape affordance', async () => {
    const onDismiss = vi.fn()
    render(
      <BulkBar count={2} onDismiss={onDismiss}>
        <BulkAction>Confirm</BulkAction>
      </BulkBar>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('BulkAction', () => {
  it('runs its handler when wired up', async () => {
    const onClick = vi.fn()
    render(<BulkAction onClick={onClick}>Export</BulkAction>)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does nothing when unwired', async () => {
    const onClick = vi.fn()
    render(
      <BulkAction unwired onClick={onClick}>
        Export
      </BulkAction>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('marks itself disabled and explains why when unwired', () => {
    render(<BulkAction unwired>Export</BulkAction>)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute('title', 'Not wired up yet')
    expect(button).toHaveTextContent('✕')
  })
})
