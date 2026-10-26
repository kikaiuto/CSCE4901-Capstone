import { useSyncExternalStore } from 'react'
import { api, ApiError, request, type RequestOptions } from '@/core/lib/api'
import { roleFromApi, type Role } from './roles'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface SessionOrganization {
  id: string
  name: string
}

export interface Session {
  token: string
  user: SessionUser
  organization: SessionOrganization
  expiresAt?: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface CurrentUserResponse {
  user_id: string
  organization_id: string
  role: string
  email: string
  full_name?: string
  organization_name?: string
}

export interface Credentials {
  organizationId: string
  email: string
  password: string
}

export const SESSION_STORAGE_KEY = 'sector7.session'

let current: Session | null | undefined
const listeners = new Set<() => void>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.organization)) return false
  const { token, user, organization, expiresAt } = value
  return (
    typeof token === 'string' &&
    token !== '' &&
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string' &&
    roleFromApi(user.role) === user.role &&
    typeof organization.id === 'string' &&
    typeof organization.name === 'string' &&
    (expiresAt === undefined || typeof expiresAt === 'number')
  )
}

function expired(session: Session): boolean {
  return session.expiresAt !== undefined && session.expiresAt <= Date.now()
}

function readStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return isSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

function store(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    return
  }
}

function set(next: Session | null) {
  current = next
  store(next)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSession(): Session | null {
  if (current === undefined) current = readStored()
  if (current && expired(current)) {
    current = null
    store(null)
  }
  return current
}

export function signIn(session: Session) {
  set(session)
}

export function signOut() {
  set(null)
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

export function useSignedIn(): Session {
  const session = useSession()
  if (!session) throw new Error('useSignedIn was called outside a signed-in screen')
  return session
}

export function sessionFromApi(
  token: string,
  me: CurrentUserResponse,
  expiresInSeconds?: number,
): Session {
  const role = roleFromApi(me.role)
  if (!role) throw new ApiError(0, 'unknown_role', `The server returned an unknown role: ${me.role}`)

  return {
    token,
    user: {
      id: me.user_id,
      name: me.full_name || me.email,
      email: me.email,
      role,
    },
    organization: {
      id: me.organization_id,
      name: me.organization_name ?? '',
    },
    ...(expiresInSeconds === undefined ? {} : { expiresAt: Date.now() + expiresInSeconds * 1000 }),
  }
}

export async function signInWithPassword(credentials: Credentials): Promise<Session> {
  const token = await api.post<TokenResponse>('/api/base/auth/login', {
    organization_id: credentials.organizationId,
    email: credentials.email,
    password: credentials.password,
  })
  const me = await api.get<CurrentUserResponse>('/api/base/auth/me', {
    token: token.access_token,
  })
  const session = sessionFromApi(token.access_token, me, token.expires_in)
  signIn(session)
  return session
}

export async function authorized<T>(
  path: string,
  options: Omit<RequestOptions, 'token'> = {},
): Promise<T> {
  const session = getSession()
  if (!session) throw new ApiError(401, 'unauthorized', 'Sign in to continue')

  try {
    return await request<T>(path, { ...options, token: session.token })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) signOut()
    throw error
  }
}
