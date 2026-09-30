import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('exposes its label to assistive technology', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} label="Select SO-1044" />)

    expect(screen.getByRole('checkbox', { name: 'Select SO-1044' })).toBeInTheDocument()
  })

  it('reports an unchecked state', () => {
    render(<Checkbox checked={false} onChange={vi.fn()} label="Select SO-1044" />)

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
  })

  it('reports a checked state', () => {
    render(<Checkbox checked onChange={vi.fn()} label="Select SO-1044" />)

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('reports a mixed state when indeterminate', () => {
    render(
      <Checkbox checked={false} indeterminate onChange={vi.fn()} label="Select every order" />,
    )

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
  })

  it('asks to be checked when currently unchecked', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} label="Select SO-1044" />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('asks to be unchecked when currently checked', async () => {
    const onChange = vi.fn()
    render(<Checkbox checked onChange={onChange} label="Select SO-1044" />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onChange).toHaveBeenCalledWith(false)
  })
})
