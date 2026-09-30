import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusPill, type Status } from './StatusPill'

describe('StatusPill', () => {
  it('shows the status name', () => {
    render(<StatusPill status="draft" />)

    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it.each([
    ['confirmed', 'text-accent'],
    ['fulfilled', 'text-positive'],
    ['cancelled', 'text-negative'],
    ['submitted', 'text-pending'],
    ['draft', 'text-ink-muted'],
  ] as const)('colours %s meaningfully', (status, expected) => {
    render(<StatusPill status={status} />)

    expect(screen.getByText(status)).toHaveClass(expected)
  })

  it('renders every status the fixtures can produce', () => {
    const statuses: Status[] = [
      'draft', 'confirmed', 'fulfilled', 'cancelled', 'submitted',
      'received', 'active', 'invited', 'auto', 'manual',
    ]

    for (const status of statuses) {
      const { unmount } = render(<StatusPill status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
      unmount()
    }
  })
})
