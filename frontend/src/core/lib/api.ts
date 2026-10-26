export const API_URL: string = import.meta.env.VITE_API_URL ?? ''

export type Query = Record<string, string | number | boolean | undefined>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
  token?: string
  signal?: AbortSignal
}

export interface ApiErrorBody {
  error: string
  message: string
  details: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function apiUrl(path: string, query?: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value))
  }
  const search = params.toString()
  return `${API_URL}${path}${search ? `?${search}` : ''}`
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false
  const body = value as Record<string, unknown>
  return typeof body.error === 'string' && typeof body.message === 'string'
}

async function errorFrom(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)

  if (isErrorBody(body)) {
    return new ApiError(response.status, body.error, body.message, body.details ?? {})
  }

  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (response.status === 422 || Array.isArray(detail)) {
      return new ApiError(response.status, 'validation_error', 'The request was not valid', {
        detail,
      })
    }
    if (typeof detail === 'string') return new ApiError(response.status, 'http_error', detail)
  }

  return new ApiError(
    response.status,
    'http_error',
    response.statusText || `Request failed with status ${response.status}`,
  )
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetch(apiUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, 'network', 'Could not reach the server')
  }

  if (!response.ok) throw await errorFrom(response)
  if (response.status === 204) return undefined as T
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(response.status, 'bad_response', 'The server sent an unreadable reply')
  }
}

export const api = {
  get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' })
  },
  post<T>(
    path: string,
    body: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body })
  },
}
