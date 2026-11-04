import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { getSession, signOut } from '@/core/app/session'
import { jsonResponse as json, mockFetch } from '@/core/test/fetch'
import { demoWorkspaces } from '../fixtures/org'
import { SignInScreen } from './SignInScreen'

const fetchMock = mockFetch()

const token = { access_token: 't1', token_type: 'bearer', expires_in: 3600 }
const me = {
  user_id: 'u1',
  organization_id: demoWorkspaces[0].id,
  role: 'owner',
  email: 'dana@acmesupply.com',
}
const refused = json(
  { error: 'unauthorized', message: 'Invalid or expired credentials', details: {} },
  401,
)

function renderSignIn(from?: string) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <SignInScreen /> },
      { path: '/home', element: <p>Today</p> },
      { path: '/sales/orders/:number', element: <p>Order</p> },
    ],
    { initialEntries: [from === undefined ? '/' : { pathname: '/', state: { from } }] },
  )

  render(<RouterProvider router={router} />)
  return router
}

async function fillIn(email = 'dana@acmesupply.com', password = 'correct horse') {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
}

function loginBody(): Record<string, unknown> {
  return JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>
}

beforeEach(() => {
  signOut()
})

describe('SignInScreen', () => {
  it('asks for a workspace, an email and a password', () => {
    renderSignIn()

    expect(screen.getByLabelText('Workspace')).toHaveValue(demoWorkspaces[0].id)
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('names the four modules the product covers', () => {
    renderSignIn()

    expect(screen.getByText('Sales · Inventory · Procurement · Accounting')).toBeInTheDocument()
  })

  it('refuses an empty form without calling the server', async () => {
    renderSignIn()

    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears a field error once the person starts typing', async () => {
    renderSignIn()

    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))
    await userEvent.type(screen.getByLabelText('Email'), 'd')

    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
  })

  it('signs in with the workspace, email and password, then goes to Today', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn()

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/home'))
    const [loginUrl, loginInit] = fetchMock.mock.calls[0]
    expect(loginUrl).toBe('/api/base/auth/login')
    expect(loginInit?.method).toBe('POST')
    expect(loginBody()).toEqual({
      organization_id: demoWorkspaces[0].id,
      email: 'dana@acmesupply.com',
      password: 'correct horse',
    })
    const [meUrl, meInit] = fetchMock.mock.calls[1]
    expect(meUrl).toBe('/api/base/auth/me')
    expect(meInit?.headers).toMatchObject({ Authorization: 'Bearer t1' })
    expect(getSession()?.user.role).toBe('Owner')
  })

  it('sends the chosen workspace', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    renderSignIn()

    await userEvent.selectOptions(screen.getByLabelText('Workspace'), demoWorkspaces[1].id)
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(loginBody().organization_id).toBe(demoWorkspaces[1].id)
  })

  it('trims the email before sending it', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    renderSignIn()

    await fillIn('  dana@acmesupply.com  ')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(loginBody().email).toBe('dana@acmesupply.com')
  })

  it('returns a visitor to the screen that sent them to sign in', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn('/sales/orders/SO-1044')

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/sales/orders/SO-1044'))
  })

  it('submits on Enter from the password field', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn()

    await fillIn('dana@acmesupply.com', 'correct horse{Enter}')

    await waitFor(() => expect(router.state.location.pathname).toBe('/home'))
  })

  it('explains refused credentials and stays on the screen', async () => {
    fetchMock.mockResolvedValue(refused)
    const router = renderSignIn()

    await fillIn('dana@acmesupply.com', 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "That email and password don't match this workspace.",
    )
    expect(router.state.location.pathname).toBe('/')
    expect(getSession()).toBeNull()
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeEnabled()
  })

  it('puts a validation reply on the email field', async () => {
    fetchMock.mockResolvedValue(
      json({ detail: [{ loc: ['body', 'email'], msg: 'Invalid email address' }] }, 422),
    )
    renderSignIn()

    await fillIn('dana', 'correct horse')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('says when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderSignIn()

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Can't reach the server. Check your connection and try again.",
    )
  })

  it('is busy while the request is in flight', async () => {
    let settle: (response: Response) => void = () => {}
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        settle = resolve
      }),
    )
    renderSignIn()

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    const button = screen.getByRole('button', { name: /Signing in/ })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()

    settle(refused)
    await screen.findByRole('alert')
  })

  it('can reveal the password', async () => {
    renderSignIn()

    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
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
