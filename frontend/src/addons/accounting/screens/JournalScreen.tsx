import { useState } from 'react'
import { ActionBar } from '@/core/components/ui/ActionBar'
import { Button } from '@/core/components/ui/Button'
import { Field, SelectShell } from '@/core/components/ui/Field'
import { Figure } from '@/core/components/ui/Figure'
import { Meter } from '@/core/components/ui/Meter'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { draftLines, recentEntries } from '../fixtures/journal'

function sum(values: string[]): number {
  return values.reduce((total, value) => total + Number(value), 0)
}

export function JournalScreen() {
  const fresh = useFirstVisit('accounting/journal')
  const [memo, setMemo] = useState('')

  const debits = sum(draftLines.map((line) => line.debit))
  const credits = sum(draftLines.map((line) => line.credit))
  const difference = Math.abs(debits - credits)
  const balanced = difference === 0

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-5xl')}>
      <PageHeader title="Journal entry" />

      <div className="mt-6 flex flex-wrap gap-4">
        <Field label="Date" defaultValue="2026-09-30" className="w-48" />
        <Field
          label="Memo"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="What is this entry for?"
          className="min-w-64 flex-1"
        />
      </div>

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
            {draftLines.map((line) => (
              <Tr key={line.id}>
                <Td className="pl-3">
                  <SelectShell value={line.account} unwired />
                </Td>
                <Td align="right">
                  <Figure value={line.debit} tone={Number(line.debit) > 0 ? 'default' : 'faint'} />
                </Td>
                <Td align="right" className="pr-3">
                  <Figure value={line.credit} tone={Number(line.credit) > 0 ? 'default' : 'faint'} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>

        <button
          type="button"
          aria-disabled="true"
          title="Not wired up yet"
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
            {recentEntries.map((entry) => (
              <Tr key={entry.id}>
                <Td className="pl-3">
                  <span className="figure">{entry.reference}</span>
                </Td>
                <Td>
                  <span className="figure text-ink-muted">{entry.date}</span>
                </Td>
                <Td className="text-ink-muted">{entry.memo}</Td>
                <Td align="right">
                  <Figure value={entry.amount} kind="money" />
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
              value={Math.min(debits, credits)}
              max={Math.max(debits, credits)}
              label="Debits against credits"
              tone={balanced ? 'positive' : 'negative'}
              className="max-w-64"
            />
            <span>
              Debits <Figure value={debits.toFixed(2)} tone="muted" /> · Credits{' '}
              <Figure value={credits.toFixed(2)} tone="muted" />
              {!balanced && (
                <>
                  {' · '}
                  <span className="text-negative">
                    Off by <Figure value={difference.toFixed(2)} tone="negative" />
                  </span>
                </>
              )}
            </span>
          </div>
        }
      >
        <Button unwired>Save draft</Button>
        <Button variant="primary" unwired>
          Post entry
        </Button>
      </ActionBar>
    </div>
  )
}
