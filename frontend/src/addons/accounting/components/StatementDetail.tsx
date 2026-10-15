import { Link } from 'react-router'
import { Figure } from '@/core/components/ui/Figure'
import { Icon } from '@/core/components/ui/Icon'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import {
  statementDerivations,
  statementEntries,
  statementPeriod,
  type StatementRow,
} from '../fixtures/reports'

export interface StatementDetailProps {
  row: StatementRow
  rows: StatementRow[]
}

function currentValue(row: StatementRow): string {
  return row.values[row.values.length - 1]
}

export function StatementDetail({ row, rows }: StatementDetailProps) {
  const entries = statementEntries[row.id]
  const derivation = statementDerivations[row.id]

  if (derivation) {
    const minuend = rows.find((candidate) => candidate.id === derivation.minuend)
    const subtrahend = rows.find((candidate) => candidate.id === derivation.subtrahend)

    return (
      <div className="px-3 py-4 text-base">
        <p className="text-ink-muted">
          {row.label} for {statementPeriod} is derived, not posted.
        </p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span>{minuend?.label}</span>
          <Figure value={minuend ? currentValue(minuend) : '0'} kind="money" />
          <span className="text-ink-muted">−</span>
          <span>{subtrahend?.label}</span>
          <Figure value={subtrahend ? currentValue(subtrahend) : '0'} kind="money" />
          <span className="text-ink-muted">=</span>
          <Figure value={currentValue(row)} kind="money" className="font-medium" />
        </p>
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="px-3 py-4 text-base text-ink-muted">
        No entries posted to {row.label} in {statementPeriod}.
      </p>
    )
  }

  return (
    <div className="px-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-base text-ink-muted">
          {entries.length} {entries.length === 1 ? 'entry posts' : 'entries post'} to{' '}
          {row.label} in {statementPeriod}
        </p>
        <Link
          to="/accounting/journal"
          className="inline-flex items-center gap-1 text-base text-accent hover:underline"
        >
          Open in journal
          <Icon name="arrow-up-right" className="size-3.5" />
        </Link>
      </div>

      <Table className="mt-3">
        <ColumnHeaders>
          <Th>Reference</Th>
          <Th>Date</Th>
          <Th>Memo</Th>
          <Th align="right">Amount</Th>
          <Th className="w-28 pl-6">Source</Th>
        </ColumnHeaders>
        <TBody>
          {entries.map((entry) => (
            <Tr key={entry.id} className="hover:bg-transparent">
              <Td>
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
          <Tr className="hover:bg-transparent">
            <Td colSpan={3} className="text-base text-ink-muted">
              Total, matches the statement
            </Td>
            <Td align="right">
              <Figure value={currentValue(row)} kind="money" className="font-medium" />
            </Td>
            <Td />
          </Tr>
        </TBody>
      </Table>
    </div>
  )
}
