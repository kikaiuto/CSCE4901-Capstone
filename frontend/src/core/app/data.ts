import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, pathWithQuery, type Query } from '@/core/lib/api'
import { authorized } from './session'

export function messageOf(cause: unknown, fallback = 'Could not load'): string {
  return cause instanceof ApiError ? cause.message : fallback
}

function isAbort(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useFetch<T>(key: string | null) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: key !== null,
    error: null,
  })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (key === null) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const controller = new AbortController()
    setState((current) => ({ ...current, loading: true }))

    authorized<T>(key, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((cause: unknown) => {
        if (isAbort(cause)) return
        setState((current) => ({ ...current, loading: false, error: messageOf(cause) }))
      })

    return () => controller.abort()
  }, [key, tick])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { ...state, reload }
}

export interface ListState<T> {
  items: T[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useList<T>(path: string | null, query?: Query): ListState<T> {
  const key = path === null ? null : pathWithQuery(path, query)
  const { data, loading, error, reload } = useFetch<T[]>(key)
  return { items: data ?? [], loading, error, reload }
}

export interface RecordState<T> {
  record: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useRecord<T>(path: string | null): RecordState<T> {
  const { data, loading, error, reload } = useFetch<T>(path)
  return { record: data, loading, error, reload }
}

export interface MutationState<TIn, TOut> {
  run: (input: TIn) => Promise<TOut>
  pending: boolean
  error: ApiError | null
  reset: () => void
}

export function useMutation<TIn, TOut>(
  fn: (input: TIn, signal: AbortSignal) => Promise<TOut>,
): MutationState<TIn, TOut> {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const mounted = useRef(false)
  const inFlight = useRef<AbortController | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      inFlight.current?.abort()
    }
  }, [])

  const run = useCallback(
    async (input: TIn) => {
      const controller = new AbortController()
      inFlight.current = controller
      setPending(true)
      setError(null)
      try {
        return await fn(input, controller.signal)
      } catch (cause) {
        if (mounted.current && !isAbort(cause)) {
          setError(
            cause instanceof ApiError
              ? cause
              : new ApiError(0, 'unknown', messageOf(cause, 'Something went wrong')),
          )
        }
        throw cause
      } finally {
        if (inFlight.current === controller) inFlight.current = null
        if (mounted.current) setPending(false)
      }
    },
    [fn],
  )

  const reset = useCallback(() => setError(null), [])

  return { run, pending, error, reset }
}
