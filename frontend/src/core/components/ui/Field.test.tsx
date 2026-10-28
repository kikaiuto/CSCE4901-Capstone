import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'

describe('Field', () => {
  it('labels its input', () => {
    render(<Field label="Email" />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('is valid by default', () => {
    render(<Field label="Email" hint="Use your work email." />)

    const input = screen.getByLabelText('Email')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAccessibleDescription('Use your work email.')
  })

  it('announces an error and points the input at it', () => {
    render(<Field label="Email" error="Enter your email" />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email')
    expect(input).toHaveAccessibleDescription('Enter your email')
  })

  it('keeps the hint when an error is shown', () => {
    render(<Field label="Email" hint="Use your work email." error="Enter your email" />)

    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter your email Use your work email.',
    )
  })

  it('renders a control beside the label and one inside the input', () => {
    render(
      <Field
        label="Password"
        labelEnd={<a href="#reset">Forgot password?</a>}
        trailing={<button type="button">Show</button>}
      />,
    )

    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument()
  })
})
