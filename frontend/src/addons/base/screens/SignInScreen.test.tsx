import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { getSession, signOut } from '@/core/app/session'
import { ApiError } from '@/core/lib/api'
import { jsonResponse as json, mockFetch } from '@/core/test/fetch'
import { demoWorkspaces } from '../fixtures/org'
import { describeFailure } from '../hooks/useSignIn'
import { SignInScreen, WORKSPACE_STORAGE_KEY } from './SignInScreen'

const fetchMock = mockFetch()

const [northstar, cedar] = demoWorkspaces
const token = { access_token: 't1', token_type: 'bearer', expires_in: 3600 }
const me = {
  user_id: 'u1',
  organization_id: northstar.id,
  organization_name: northstar.name,
  role: 'owner',
  email: 'owner@northstar.demo',
  full_name: 'Dana Owens',
  is_active: true,
}
const refused = json(
  { error: 'unauthorized', message: 'Invalid or expired credentials', details: {} },
  401,
)

function renderSignIn(from?: unknown) {
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

async function chooseWorkspace(name = northstar.name) {
  await userEvent.click(screen.getByRole('button', { name }))
}

async function fillIn(email = 'owner@northstar.demo', password = 'sector7-demo') {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
}

function loginBody(): Record<string, unknown> {
  return JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>
}

beforeEach(() => {
  signOut()
  localStorage.clear()
})

describe('SignInScreen', () => {
  it('opens on the workspace choice', () => {
    renderSignIn()

    expect(screen.getByRole('heading', { name: 'Choose your workspace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: northstar.name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: cedar.name })).toBeInTheDocument()
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })

  it('names the four modules the product covers', () => {
    renderSignIn()

    expect(screen.getByText('Sales · Inventory · Procurement · Accounting')).toBeInTheDocument()
  })

  it('moves to credentials for the chosen workspace and focuses the email', async () => {
    renderSignIn()

    await chooseWorkspace(cedar.name)

    expect(screen.getByRole('heading', { name: `Sign in to ${cedar.name}` })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveFocus()
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBe(cedar.id)
  })

  it('remembers the workspace for the next visit', () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, cedar.id)

    renderSignIn()

    expect(screen.getByRole('heading', { name: `Sign in to ${cedar.name}` })).toBeInTheDocument()
  })

  it('ignores a remembered workspace it does not know', () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, 'not-a-workspace')

    renderSignIn()

    expect(screen.getByRole('heading', { name: 'Choose your workspace' })).toBeInTheDocument()
  })

  it('goes back to the workspace choice and forgets it', async () => {
    renderSignIn()

    await chooseWorkspace()
    await userEvent.click(screen.getByRole('button', { name: 'Use a different workspace' }))

    expect(screen.getByRole('heading', { name: 'Choose your workspace' })).toBeInTheDocument()
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull()
  })

  it('refuses an empty form without calling the server', async () => {
    renderSignIn()

    await chooseWorkspace()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears a field error once the person starts typing', async () => {
    renderSignIn()

    await chooseWorkspace()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))
    await userEvent.type(screen.getByLabelText('Email'), 'd')

    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
  })

  it('signs in with the workspace, email and password, then goes to Today', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn()

    await chooseWorkspace()
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/home'))
    const [loginUrl, loginInit] = fetchMock.mock.calls[0]
    expect(loginUrl).toBe('/api/base/auth/login')
    expect(loginInit?.method).toBe('POST')
    expect(loginBody()).toEqual({
      organization_id: northstar.id,
      email: 'owner@northstar.demo',
      password: 'sector7-demo',
    })
    const [meUrl, meInit] = fetchMock.mock.calls[1]
    expect(meUrl).toBe('/api/base/auth/me')
    expect(meInit?.headers).toMatchObject({ Authorization: 'Bearer t1' })
    expect(getSession()?.user.role).toBe('Owner')
    expect(getSession()?.organization.name).toBe(northstar.name)
  })

  it('sends the chosen workspace', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    renderSignIn()

    await chooseWorkspace(cedar.name)
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(loginBody().organization_id).toBe(cedar.id)
  })

  it('trims the email before sending it', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    renderSignIn()

    await chooseWorkspace()
    await fillIn('  owner@northstar.demo  ')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(loginBody().email).toBe('owner@northstar.demo')
  })

  it('returns a visitor to the screen that sent them to sign in', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn('/sales/orders/SO-1044')

    await chooseWorkspace()
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/sales/orders/SO-1044'))
  })

  it('ignores a return path that leaves the app', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn('//evil.example/phish')

    await chooseWorkspace()
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/home'))
  })

  it('submits on Enter from the password field', async () => {
    fetchMock.mockResolvedValueOnce(json(token)).mockResolvedValueOnce(json(me))
    const router = renderSignIn()

    await chooseWorkspace()
    await fillIn('owner@northstar.demo', 'sector7-demo{Enter}')

    await waitFor(() => expect(router.state.location.pathname).toBe('/home'))
  })

  it('explains refused credentials and stays on the screen', async () => {
    fetchMock.mockResolvedValue(refused)
    const router = renderSignIn()

    await chooseWorkspace()
    await fillIn('owner@northstar.demo', 'wrong')
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

    await chooseWorkspace()
    await fillIn('dana', 'sector7-demo')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('says when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderSignIn()

    await chooseWorkspace()
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Can't reach the server. Check your connection and try again.",
    )
  })

  it('is busy while the request is in flight and sends one request', async () => {
    let settle: (response: Response) => void = () => {}
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        settle = resolve
      }),
    )
    renderSignIn()

    await chooseWorkspace()
    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /Sign in/ }))

    const button = screen.getByRole('button', { name: /Signing in/ })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    settle(refused)
    await screen.findByRole('alert')
  })

  it('can reveal the password', async () => {
    renderSignIn()

    await chooseWorkspace()
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('leaves password recovery and organization creation unwired', async () => {
    renderSignIn()

    expect(screen.getByRole('button', { name: 'Create an organization' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await chooseWorkspace()

    expect(screen.getByRole('button', { name: 'Forgot password?' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})

describe('describeFailure', () => {
  it('maps each failure to where it is shown', () => {
    expect(describeFailure(new ApiError(401, 'unauthorized', 'Invalid'))).toEqual({
      form: "That email and password don't match this workspace.",
    })
    expect(describeFailure(new ApiError(0, 'network', 'Could not reach the server'))).toEqual({
      form: "Can't reach the server. Check your connection and try again.",
    })
    expect(
      describeFailure(
        new ApiError(422, 'validation_error', 'The request was not valid', {
          detail: [{ loc: ['body', 'email'] }],
        }),
      ),
    ).toEqual({ email: 'Enter a valid email address' })
    expect(
      describeFailure(new ApiError(422, 'validation_error', 'The request was not valid', {})),
    ).toEqual({ form: 'The request was not valid' })
    expect(describeFailure(new ApiError(0, 'unknown_role', 'The server returned an unknown role: x'))).toEqual({
      form: 'The server returned an unknown role: x',
    })
    expect(describeFailure(new Error('boom'))).toEqual({ form: 'Something went wrong. Try again.' })
  })
})
