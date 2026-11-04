import { useList } from '@/core/app/data'
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

export const useAccounts = () => useList<AccountResponse>('/api/accounting/accounts')

export const useRecentEntries = () =>
  useList<JournalEntrySummary>('/api/accounting/journal-entries', { limit: 20 })

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
