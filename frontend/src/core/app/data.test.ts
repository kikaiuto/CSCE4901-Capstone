import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/core/lib/api'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { useList, useMutation, useRecord } from './data'

const fetchMock = mockFetch()

function requestedUrl(call = 0): string {
  const [input] = fetchMock.mock.calls[call]
  return String(input)
}

function requestedSignal(call = 0): AbortSignal | undefined {
  const [, init] = fetchMock.mock.calls[call]
  return init?.signal ?? undefined
}

describe('useList', () => {
  it('loads the list and clears loading', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 1 }, { id: 2 }]))

    const { result } = renderHook(() => useList<{ id: number }>('/api/things'))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.current.error).toBeNull()
  })

  it('puts the query on the URL and sends the session token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))

    renderHook(() => useList('/api/things', { limit: 20, offset: 0 }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(requestedUrl()).toBe('/api/things?limit=20&offset=0')
    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init?.headers).get('Authorization')).toMatch(/^Bearer /)
  })

  it('surfaces the backend message on a failed request', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'forbidden', message: 'Your role cannot see this', details: {} }, 403),
    )

    const { result } = renderHook(() => useList('/api/things'))

    await waitFor(() => expect(result.current.error).toBe('Your role cannot see this'))
    expect(result.current.items).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('says when the server cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useList('/api/things'))

    await waitFor(() => expect(result.current.error).toBe('Could not reach the server'))
  })

  it('fetches again on reload', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1 }]))

    const { result } = renderHook(() => useList('/api/things'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.reload())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('clears a previous error while reloading', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ error: 'forbidden', message: 'Not for you', details: {} }, 403),
      )
      .mockImplementationOnce(() => new Promise(() => {}))

    const { result } = renderHook(() => useList('/api/things'))
    await waitFor(() => expect(result.current.error).toBe('Not for you'))

    act(() => result.current.reload())

    await waitFor(() => expect(result.current.loading).toBe(true))
    expect(result.current.error).toBeNull()
  })

  it('drops the old list when the path changes', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }]))
      .mockImplementationOnce(() => new Promise(() => {}))

    const { result, rerender } = renderHook(({ path }) => useList<{ id: number }>(path), {
      initialProps: { path: '/api/one' },
    })
    await waitFor(() => expect(result.current.items).toEqual([{ id: 1 }]))

    rerender({ path: '/api/two' })

    await waitFor(() => expect(result.current.loading).toBe(true))
    expect(result.current.items).toEqual([])
  })

  it('stays idle with a null path', () => {
    const { result } = renderHook(() => useList(null))

    expect(result.current.loading).toBe(false)
    expect(result.current.items).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('aborts the request when the component unmounts', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))

    const { unmount } = renderHook(() => useList('/api/things'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    unmount()

    expect(requestedSignal()?.aborted).toBe(true)
  })

  it('refetches once when the query changes', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))

    const { rerender } = renderHook(({ page }) => useList('/api/things', { page }), {
      initialProps: { page: 1 },
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    rerender({ page: 1 })
    rerender({ page: 2 })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(requestedUrl(1)).toBe('/api/things?page=2')
  })
})

describe('useRecord', () => {
  it('loads one record', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 7, name: 'Widget' }))

    const { result } = renderHook(() => useRecord<{ id: number; name: string }>('/api/things/7'))

    await waitFor(() => expect(result.current.record).toEqual({ id: 7, name: 'Widget' }))
    expect(result.current.loading).toBe(false)
  })

  it('reports a missing record through the error', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'not_found', message: 'Product not found', details: {} }, 404),
    )

    const { result } = renderHook(() => useRecord('/api/things/9'))

    await waitFor(() => expect(result.current.error).toBe('Product not found'))
    expect(result.current.record).toBeNull()
  })
})

describe('useMutation', () => {
  it('tracks pending state and resolves with the result', async () => {
    let release: (value: string) => void = () => {}
    const fn = () => new Promise<string>((resolve) => (release = resolve))

    const { result } = renderHook(() => useMutation<void, string>(fn))

    let outcome: Promise<string> = Promise.resolve('')
    act(() => {
      outcome = result.current.run()
    })
    expect(result.current.pending).toBe(true)

    await act(async () => {
      release('done')
      await outcome
    })

    expect(result.current.pending).toBe(false)
    expect(result.current.error).toBeNull()
    await expect(outcome).resolves.toBe('done')
  })

  it('stores an ApiError and rethrows it', async () => {
    const failure = new ApiError(409, 'duplicate_sku', 'A product with this SKU already exists')
    const { result } = renderHook(() => useMutation<void, void>(() => Promise.reject(failure)))

    await act(async () => {
      await expect(result.current.run()).rejects.toBe(failure)
    })

    expect(result.current.error).toBe(failure)
    expect(result.current.pending).toBe(false)

    act(() => result.current.reset())
    expect(result.current.error).toBeNull()
  })

  it('wraps an unknown failure so the screen still has a message', async () => {
    const { result } = renderHook(() =>
      useMutation<void, void>(() => Promise.reject(new Error('boom'))),
    )

    await act(async () => {
      await expect(result.current.run()).rejects.toThrow('boom')
    })

    expect(result.current.error?.message).toBe('Something went wrong')
  })
})
