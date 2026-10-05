import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Confirm</Button>)

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('calls onClick when wired up', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Confirm</Button>)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('defaults to type button so it never submits a form by accident', () => {
    render(<Button>Confirm</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('can opt into being a submit button', () => {
    render(<Button type="submit">Sign in</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('renders a shortcut chip', () => {
    render(<Button shortcut="N">New order</Button>)

    expect(screen.getByText('N')).toBeInTheDocument()
  })
})

describe('Button when unwired', () => {
  it('does not call onClick', async () => {
    const onClick = vi.fn()
    render(
      <Button unwired onClick={onClick}>
        Confirm
      </Button>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('marks itself disabled for assistive technology', () => {
    render(<Button unwired>Confirm</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  it('explains itself on hover', () => {
    render(<Button unwired>Confirm</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Not wired up yet')
  })

  it('shows the crossed out marker', () => {
    render(<Button unwired>Confirm</Button>)

    expect(screen.getByRole('button')).toHaveTextContent('✕')
  })

  it('stays focusable so keyboard users can discover it', () => {
    render(<Button unwired>Confirm</Button>)

    expect(screen.getByRole('button')).not.toHaveAttribute('disabled')
  })

  it('does not claim to be disabled when it is wired up', () => {
    render(<Button>Confirm</Button>)

    const button = screen.getByRole('button')
    expect(button).not.toHaveAttribute('aria-disabled')
    expect(button).not.toHaveTextContent('✕')
  })
})
