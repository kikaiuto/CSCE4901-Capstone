import { useCallback, useEffect, useState } from 'react'
import { authorized } from '@/core/app/session'
import { ApiError } from '@/core/lib/api'
import type { AccountResponse, JournalEntrySummary } from '../fixtures/journal'

export interface PostLine {
  account_id: string
  debit: string
  credit: string
}

export interface PostBody {
  entry_date: string
  memo: string
  lines: PostLine[]
}

export type LineProblem = 'both_sides' | 'neither_side' | 'negative' | 'too_precise'

export interface LineError {
  index: number
  problem: LineProblem
}

export interface PostRejection {
  message: string
  lineErrors: LineError[]
}

// Loads once on mount; `reload` refetches. Failures leave the list empty and set `error`.
function useList<T>(path: string, query?: Record<string, number>) {
  const [items, setItems] = useState<T[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    authorized<T[]>(path, { query, signal: controller.signal })
      .then((rows) => {
        setItems(rows)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof ApiError ? cause.message : 'Could not load')
      })
    return () => controller.abort()
  }, [path, tick])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { items, error, reload }
}

export const useAccounts = () => useList<AccountResponse>('/api/accounting/accounts')

export const useRecentEntries = () =>
  useList<JournalEntrySummary>('/api/accounting/journal-entries', { limit: 20 })

// Resolves on 201; throws PostRejection for a 422 unbalanced_entry, ApiError otherwise.
export async function postEntry(body: PostBody): Promise<void> {
  try {
    await authorized('/api/accounting/journal-entries', { method: 'POST', body })
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === 'unbalanced_entry') {
      const raw = cause.details.line_errors
      const rejection: PostRejection = {
        message: cause.message,
        lineErrors: Array.isArray(raw) ? (raw as LineError[]) : [],
      }
      throw rejection
    }
    throw cause
  }
}
