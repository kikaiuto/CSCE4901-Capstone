import { useState } from 'react'
import { ActionBar } from '@/core/components/ui/ActionBar'
import { Button } from '@/core/components/ui/Button'
import { Field } from '@/core/components/ui/Field'
import { Figure } from '@/core/components/ui/Figure'
import { Meter } from '@/core/components/ui/Meter'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { SectionNav } from '@/core/components/ui/SectionNav'
import { Select } from '@/core/components/ui/Select'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { ApiError } from '@/core/lib/api'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { fromCents, toCents } from '../hooks/journalMoney'
import {
  postEntry,
  useAccounts,
  useRecentEntries,
  type LineProblem,
  type PostRejection,
} from '../hooks/useJournal'
import { ACCOUNTING_SECTIONS } from '../sections'

const PROBLEMS: Record<LineProblem, string> = {
  both_sides: 'Enter a debit or a credit, not both',
  neither_side: 'Enter a debit or a credit',
  negative: 'Amounts cannot be negative',
  too_precise: 'Use at most two decimal places',
}

interface DraftLine {
  id: number
  accountId: string
  debit: string
  credit: string
}

let nextId = 1
const blankLine = (): DraftLine => ({ id: nextId++, accountId: '', debit: '', credit: '' })
const today = () => new Date().toISOString().slice(0, 10)

const amountInput =
  'h-9 w-32 rounded-control border border-line-strong bg-surface px-3 text-right text-base focus:border-accent focus:outline-none'

export function JournalScreen() {
  const fresh = useFirstVisit('accounting/journal')
  const [memo, setMemo] = useState('')
  const [date, setDate] = useState(today)
  const [lines, setLines] = useState<DraftLine[]>(() => [blankLine(), blankLine()])
  const [problems, setProblems] = useState<Record<number, LineProblem>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const accounts = useAccounts()
  const recent = useRecentEntries()
  const accountOptions = [
    { value: '', label: 'Choose an account' },
    ...accounts.items.map((a) => ({
      value: a.account_id,
      label: `${a.account_code} · ${a.account_name}`,
    })),
  ]

  const debitCents = lines.reduce((total, line) => total + toCents(line.debit), 0)
  const creditCents = lines.reduce((total, line) => total + toCents(line.credit), 0)
  const differenceCents = Math.abs(debitCents - creditCents)
  const balanced = differenceCents === 0

  const update = (id: number, patch: Partial<DraftLine>) =>
    setLines((all) => all.map((line) => (line.id === id ? { ...line, ...patch } : line)))

  async function post() {
    if (posting) return
    // Blank rows are dropped; `sent` maps the server's line index back to its row.
    const sent = lines.filter((line) => line.accountId || line.debit.trim() || line.credit.trim())
    setPosting(true)
    setFailure(null)
    setProblems({})
    try {
      await postEntry({
        entry_date: date,
        memo,
        lines: sent.map((line) => ({
          account_id: line.accountId,
          debit: line.debit.trim() || '0.00',
          credit: line.credit.trim() || '0.00',
        })),
      })
      setMemo('')
      setLines([blankLine(), blankLine()])
      recent.reload()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setFailure(cause.message)
      } else if (cause && typeof cause === 'object' && 'lineErrors' in cause) {
        const rejection = cause as PostRejection
        setFailure(rejection.message)
        setProblems(
          Object.fromEntries(
            rejection.lineErrors.flatMap((e) => (sent[e.index] ? [[sent[e.index].id, e.problem]] : [])),
          ),
        )
      } else {
        setFailure('Could not post the entry')
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-5xl')}>
      <PageHeader title="Journal entry" />

      <SectionNav label="Accounting sections" items={ACCOUNTING_SECTIONS} className="mt-5" />

      <div className="mt-6 flex flex-wrap gap-4">
        <Field
          label="Date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-48"
        />
        <Field
          label="Memo"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="What is this entry for?"
          className="min-w-64 flex-1"
        />
      </div>

      {(failure ?? accounts.error) && (
        <p role="alert" className="mt-4 text-base text-negative">
          {failure ?? accounts.error}
        </p>
      )}

      <section className="mt-7">
        <h2 className="section-label">Lines</h2>

        <Table className="mt-3">
          <ColumnHeaders>
            <Th className="pl-3">Account</Th>
            <Th align="right">Debit</Th>
            <Th align="right" className="pr-3">
              Credit
            </Th>
          </ColumnHeaders>

          <TBody>
            {lines.map((line, i) => (
              <Tr key={line.id}>
                <Td className="pl-3">
                  <div className="max-w-sm">
                    <Select
                      label={`Account, line ${i + 1}`}
                      labelHidden
                      size="sm"
                      value={line.accountId}
                      onChange={(event) => update(line.id, { accountId: event.target.value })}
                      options={accountOptions}
                    />
                  </div>
                  {problems[line.id] && (
                    <p className="mt-1 text-xs text-negative">{PROBLEMS[problems[line.id]]}</p>
                  )}
                </Td>
                <Td align="right">
                  <input
                    aria-label={`Debit, line ${i + 1}`}
                    aria-invalid={problems[line.id] ? true : undefined}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={line.debit}
                    onChange={(event) => update(line.id, { debit: event.target.value })}
                    className={amountInput}
                  />
                </Td>
                <Td align="right" className="pr-3">
                  <input
                    aria-label={`Credit, line ${i + 1}`}
                    aria-invalid={problems[line.id] ? true : undefined}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={line.credit}
                    onChange={(event) => update(line.id, { credit: event.target.value })}
                    className={amountInput}
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>

        <button
          type="button"
          onClick={() => setLines((all) => [...all, blankLine()])}
          className="mt-3 px-1.5 text-base text-accent"
        >
          + Add line
        </button>
      </section>

      <section className="mt-9">
        <h2 className="section-label">Recent</h2>

        <Table className="mt-3">
          <ColumnHeaders>
            <Th className="pl-3">Reference</Th>
            <Th>Date</Th>
            <Th>Memo</Th>
            <Th align="right">Amount</Th>
            <Th className="w-28 pl-6">Source</Th>
          </ColumnHeaders>
          <TBody>
            {recent.items.map((entry) => (
              <Tr key={entry.entry_id}>
                <Td className="pl-3">
                  <span className="figure">{entry.entry_id}</span>
                </Td>
                <Td>
                  <span className="figure text-ink-muted">{entry.entry_date}</span>
                </Td>
                <Td className="text-ink-muted">{entry.memo}</Td>
                <Td align="right">
                  <Figure value={entry.total} kind="money" />
                </Td>
                <Td className="pl-6">
                  <StatusPill status={entry.source} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </section>

      <ActionBar
        preview={
          <div className="flex flex-col gap-1.5">
            <Meter
              value={Math.min(debitCents, creditCents)}
              max={Math.max(debitCents, creditCents)}
              label="Debits against credits"
              tone={balanced ? 'positive' : 'negative'}
              className="max-w-64"
            />
            <span>
              Debits <Figure value={fromCents(debitCents)} tone="muted" /> · Credits{' '}
              <Figure value={fromCents(creditCents)} tone="muted" />
              {!balanced && (
                <>
                  {' · '}
                  <span className="text-negative">
                    Off by <Figure value={fromCents(differenceCents)} tone="negative" />
                  </span>
                </>
              )}
            </span>
          </div>
        }
      >
        <Button unwired>Save draft</Button>
        <Button variant="primary" onClick={post} className={posting ? 'opacity-60' : undefined}>
          Post entry
        </Button>
      </ActionBar>
    </div>
  )
}
