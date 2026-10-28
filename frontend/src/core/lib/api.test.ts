import { describe, expect, it } from 'vitest'
import { jsonResponse as json, mockFetch } from '@/core/test/fetch'
import { api, ApiError, apiUrl, request } from './api'

const fetchMock = mockFetch()

describe('apiUrl', () => {
  it('is same-origin by default and appends only defined query values', () => {
    expect(apiUrl('/api/inventory/products')).toBe('/api/inventory/products')
    expect(apiUrl('/api/inventory/products', { limit: 50, offset: 0, q: undefined })).toBe(
      '/api/inventory/products?limit=50&offset=0',
    )
  })
})

describe('request', () => {
  it('sends JSON with a bearer token and parses the JSON reply', async () => {
    fetchMock.mockResolvedValue(json({ ok: true }))

    const reply = await request<{ ok: boolean }>('/api/base/auth/me', {
      method: 'POST',
      body: { email: 'dana@acmesupply.com' },
      token: 'abc',
    })

    expect(reply).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/base/auth/me')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ email: 'dana@acmesupply.com' }))
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer abc',
      'Content-Type': 'application/json',
    })
  })

  it('sends no body or content type on a GET', async () => {
    fetchMock.mockResolvedValue(json([]))

    await api.get('/api/inventory/products', { query: { limit: 10 } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/inventory/products?limit=10')
    expect(init?.body).toBeUndefined()
    expect(init?.headers).not.toHaveProperty('Content-Type')
  })

  it("turns the backend's error envelope into an ApiError", async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: 'insufficient_stock',
          message: '1 line(s) short on stock',
          details: { shortages: [{ product_id: 'p1', requested: 10, available: 4 }] },
        },
        409,
      ),
    )

    const failure = await api.post('/api/sales/orders', {}).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    const error = failure as ApiError
    expect(error.status).toBe(409)
    expect(error.code).toBe('insufficient_stock')
    expect(error.message).toBe('1 line(s) short on stock')
    expect(error.details).toEqual({
      shortages: [{ product_id: 'p1', requested: 10, available: 4 }],
    })
  })

  it("carries the backend's 401 envelope through unchanged", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Sign in to continue', details: {} }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' },
        },
      ),
    )

    const failure = (await api.get('/api/base/auth/me').catch((e: unknown) => e)) as ApiError

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(401)
    expect(failure.code).toBe('unauthorized')
    expect(failure.message).toBe('Sign in to continue')
    expect(failure.details).toEqual({})
  })

  it('reports a FastAPI validation reply as a validation error', async () => {
    fetchMock.mockResolvedValue(
      json({ detail: [{ loc: ['body', 'email'], msg: 'Invalid email address' }] }, 422),
    )

    const failure = (await api.post('/api/base/auth/login', {}).catch((e: unknown) => e)) as ApiError

    expect(failure.status).toBe(422)
    expect(failure.code).toBe('validation_error')
    expect(failure.details.detail).toHaveLength(1)
  })

  it("keeps FastAPI's own 404 as an http error, not a validation error", async () => {
    fetchMock.mockResolvedValue(json({ detail: 'Not Found' }, 404))

    const failure = (await api.get('/api/missing').catch((e: unknown) => e)) as ApiError

    expect(failure.status).toBe(404)
    expect(failure.code).toBe('http_error')
    expect(failure.message).toBe('Not Found')
  })

  it('reports a successful reply that is not JSON as a bad response', async () => {
    fetchMock.mockResolvedValue(new Response('<!doctype html>', { status: 200 }))

    const failure = (await api.get('/api/base/auth/me').catch((e: unknown) => e)) as ApiError

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.code).toBe('bad_response')
  })

  it('still produces an ApiError when the reply is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }))

    const failure = (await api.get('/api/base/users').catch((e: unknown) => e)) as ApiError

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(502)
    expect(failure.code).toBe('http_error')
  })

  it('reports an unreachable server as a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const failure = (await api.get('/api/base/users').catch((e: unknown) => e)) as ApiError

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure.status).toBe(0)
    expect(failure.code).toBe('network')
  })

  it('lets an abort through untouched', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(api.get('/api/base/users')).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('returns nothing for an empty reply', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(request('/api/sales/orders/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
