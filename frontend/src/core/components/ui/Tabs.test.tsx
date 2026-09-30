import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs, type TabItem } from './Tabs'

type Filter = 'all' | 'draft' | 'confirmed'

const ITEMS: readonly TabItem<Filter>[] = [
  { id: 'all', label: 'All', count: 48 },
  { id: 'draft', label: 'Draft', count: 6 },
  { id: 'confirmed', label: 'Confirmed' },
]

describe('Tabs', () => {
  it('renders one tab per item', () => {
    render(<Tabs items={ITEMS} active="all" onChange={vi.fn()} />)

    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('shows a count when the item has one', () => {
    render(<Tabs items={ITEMS} active="all" onChange={vi.fn()} />)

    expect(screen.getByText('48')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('marks only the active tab as selected', () => {
    render(<Tabs items={ITEMS} active="draft" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: /Draft/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('reports the tab that was clicked', async () => {
    const onChange = vi.fn()
    render(<Tabs items={ITEMS} active="all" onChange={onChange} />)

    await userEvent.click(screen.getByRole('tab', { name: /Confirmed/ }))

    expect(onChange).toHaveBeenCalledWith('confirmed')
  })
})
