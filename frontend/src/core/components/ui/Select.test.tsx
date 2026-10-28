import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

const options = [
  { value: 'north', label: 'Northstar' },
  { value: 'cedar', label: 'Cedar' },
]

describe('Select', () => {
  it('labels a real select with every option', () => {
    render(<Select label="Workspace" options={options} defaultValue="north" />)

    const select = screen.getByLabelText('Workspace')
    expect(select.tagName).toBe('SELECT')
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(select).toHaveValue('north')
  })

  it('reports a change', async () => {
    const onChange = vi.fn()
    render(<Select label="Workspace" options={options} defaultValue="north" onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Workspace'), 'cedar')

    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Workspace')).toHaveValue('cedar')
  })

  it('announces an error', () => {
    render(<Select label="Workspace" options={options} error="Choose a workspace" />)

    expect(screen.getByLabelText('Workspace')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a workspace')
  })
})
