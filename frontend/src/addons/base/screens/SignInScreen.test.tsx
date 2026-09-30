import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SignInScreen } from './SignInScreen'

function renderSignIn() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <SignInScreen /> },
      { path: '/home', element: <p>Today</p> },
    ],
    { initialEntries: ['/'] },
  )

  render(<RouterProvider router={router} />)
  return router
}

describe('SignInScreen', () => {
  it('asks for an email and a password', () => {
    renderSignIn()

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('names the four modules the product covers', () => {
    renderSignIn()

    expect(screen.getByText('Sales · Inventory · Procurement · Accounting')).toBeInTheDocument()
  })

  it('goes to Today when the form is submitted', async () => {
    const router = renderSignIn()

    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(router.state.location.pathname).toBe('/home')
  })

  it('submits on Enter from the password field', async () => {
    const router = renderSignIn()

    await userEvent.type(screen.getByLabelText('Password'), '{Enter}')

    expect(router.state.location.pathname).toBe('/home')
  })

  it('leaves password recovery and org creation unwired', () => {
    renderSignIn()

    expect(screen.getByRole('button', { name: 'Forgot password?' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Create an organization' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
