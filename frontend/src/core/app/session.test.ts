import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/core/lib/api'
import { jsonResponse as json, mockFetch } from '@/core/test/fetch'
import {
  authorized,
  getSession,
  SESSION_STORAGE_KEY,
  sessionFromApi,
  signIn,
  signInWithPassword,
  signOut,
  useSession,
  useSignedIn,
  type CurrentUserResponse,
  type Session,
} from './session'

const me: CurrentUserResponse = {
  user_id: 'u1',
  organization_id: 'o1',
  role: 'inventory',
  email: 'lee@acmesupply.com',
}

const session: Session = {
  token: 't1',
  user: { id: 'u1', name: 'Lee Carter', email: 'lee@acmesupply.com', role: 'Inventory' },
  organization: { id: 'o1', name: 'Acme Supply' },
}

const fetchMock = mockFetch()

beforeEach(() => {
  signOut()
})

describe('session store', () => {
  it('starts signed out and remembers a sign-in', () => {
    expect(getSession()).toBeNull()

    signIn(session)

    expect(getSession()).toBe(session)
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? 'null')).toEqual(session)
  })

  it('forgets everything on sign-out', () => {
    signIn(session)
    signOut()

    expect(getSession()).toBeNull()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('re-renders subscribers when the session changes', () => {
    const { result } = renderHook(() => useSession())

    expect(result.current).toBeNull()

    act(() => signIn(session))
    expect(result.current).toBe(session)

    act(() => signOut())
    expect(result.current).toBeNull()
  })

  it('refuses to render a signed-in screen for a visitor', () => {
    expect(() => renderHook(() => useSignedIn())).toThrow(/signed-in/)
  })

  it('reads a stored session on a fresh load', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    vi.resetModules()

    const fresh = await import('./session')

    expect(fresh.getSession()).toEqual(session)
    fresh.signOut()
  })

  it('ignores a stored session that does not have the expected shape', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 't1', user: {} }))
    vi.resetModules()

    const fresh = await import('./session')

    expect(fresh.getSession()).toBeNull()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()
    fresh.signOut()
  })

  it('treats a session whose token has expired as signed out', () => {
    signIn({ ...session, expiresAt: Date.now() - 1 })

    expect(getSession()).toBeNull()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('keeps a session whose token is still good', () => {
    const live = { ...session, expiresAt: Date.now() + 60_000 }
    signIn(live)

    expect(getSession()).toBe(live)
  })
})

describe('sessionFromApi', () => {
  it("maps the backend's lowercase role and falls back to the email as the name", () => {
    const mapped = sessionFromApi('t1', me)

    expect(mapped.user).toEqual({
      id: 'u1',
      name: 'lee@acmesupply.com',
      email: 'lee@acmesupply.com',
      role: 'Inventory',
    })
    expect(mapped.organization).toEqual({ id: 'o1', name: '' })
    expect(mapped.token).toBe('t1')
  })

  it('prefers the display name and organization name when the backend sends them', () => {
    const mapped = sessionFromApi('t1', {
      ...me,
      full_name: 'Lee Carter',
      organization_name: 'Acme Supply',
    })

    expect(mapped.user.name).toBe('Lee Carter')
    expect(mapped.organization.name).toBe('Acme Supply')
  })

  it('rejects a role the screens do not know', () => {
    expect(() => sessionFromApi('t1', { ...me, role: 'superuser' })).toThrow(ApiError)
  })
})

describe('signInWithPassword', () => {
  it('logs in, fetches the current user with the new token, and signs in', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'jwt', token_type: 'bearer', expires_in: 3600 }))
      .mockResolvedValueOnce(json(me))

    const result = await signInWithPassword({
      organizationId: 'o1',
      email: 'lee@acmesupply.com',
      password: 'secret',
    })

    expect(result.token).toBe('jwt')
    expect(getSession()).toBe(result)
    expect(result.expiresAt).toBeGreaterThan(Date.now() + 3_500_000)
    expect(result.expiresAt).toBeLessThanOrEqual(Date.now() + 3_600_000)

    const [loginUrl, loginInit] = fetchMock.mock.calls[0]
    expect(loginUrl).toBe('/api/base/auth/login')
    expect(JSON.parse(String(loginInit?.body))).toEqual({
      organization_id: 'o1',
      email: 'lee@acmesupply.com',
      password: 'secret',
    })

    const [meUrl, meInit] = fetchMock.mock.calls[1]
    expect(meUrl).toBe('/api/base/auth/me')
    expect(meInit?.headers).toMatchObject({ Authorization: 'Bearer jwt' })
  })

  it('leaves the visitor signed out when the credentials are refused', async () => {
    fetchMock.mockResolvedValueOnce(
      json({ error: 'unauthorized', message: 'Invalid or expired credentials', details: {} }, 401),
    )

    await expect(
      signInWithPassword({ organizationId: 'o1', email: 'x@y.test', password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid or expired credentials' })
    expect(getSession()).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('authorized', () => {
  it('attaches the session token', async () => {
    signIn(session)
    fetchMock.mockResolvedValue(json([]))

    await authorized('/api/base/users')

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer t1' })
  })

  it('refuses without a session and never calls the server', async () => {
    await expect(authorized('/api/base/users')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs out when the server says the token is no longer good', async () => {
    signIn(session)
    fetchMock.mockResolvedValue(
      json({ error: 'unauthorized', message: 'Invalid or expired token', details: {} }, 401),
    )

    await expect(authorized('/api/base/users')).rejects.toMatchObject({ status: 401 })
    expect(getSession()).toBeNull()
  })

  it('keeps the session on any other failure', async () => {
    signIn(session)
    fetchMock.mockResolvedValue(json({ error: 'forbidden', message: 'No', details: {} }, 403))

    await expect(authorized('/api/base/users')).rejects.toMatchObject({ status: 403 })
    expect(getSession()).toBe(session)
  })
})
