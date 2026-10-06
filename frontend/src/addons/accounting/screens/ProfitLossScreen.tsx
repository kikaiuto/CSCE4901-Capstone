import { useState } from 'react'
import { Button } from '@/core/components/ui/Button'
import { SelectShell } from '@/core/components/ui/Field'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { SectionNav } from '@/core/components/ui/SectionNav'
import { SegmentedControl } from '@/core/components/ui/SegmentedControl'
import { StatTile } from '@/core/components/ui/StatTile'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import {
  ChartCard,
  ComparisonBars,
  SegmentBar,
  TrendLine,
  chartColor,
  useSyncedHover,
} from '@/core/components/charts'
import { cn } from '@/core/lib/cn'
import { compactMoney } from '@/core/lib/decimal'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { ACCOUNTING_SECTIONS } from '../sections'
import {
  headline,
  periods,
  receivablesAging,
  statement,
  statementColumns,
  type ReportCadence,
} from '../fixtures/reports'

const CADENCES = [
  { id: 'month' as const, label: 'Month' },
  { id: 'quarter' as const, label: 'Quarter' },
]

const DOLLAR_SERIES = [
  { key: 'revenue', label: 'Revenue', color: chartColor.current },
  { key: 'cogs', label: 'Cost of goods', color: chartColor.third },
  { key: 'opex', label: 'Operating exp.', color: chartColor.previous },
]

const AGING_COLORS = [
  chartColor.current,
  chartColor.third,
  'var(--color-pending)',
  'var(--color-negative)',
]

export function ProfitLossScreen() {
  const [cadence, setCadence] = useState<ReportCadence>('month')
  const hover = useSyncedHover()
  const fresh = useFirstVisit('accounting/profit-loss')

  const data = periods[cadence]
  const active = hover.activeIndex == null ? null : data[hover.activeIndex]

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="Profit and loss"
        actions={
          <>
            <SelectShell value="Apr – Sep 2026" unwired />
            <SegmentedControl
              options={CADENCES}
              value={cadence}
              onChange={setCadence}
              label="Reporting cadence"
            />
            <SelectShell value="Compare: previous period" unwired />
            <Button unwired>Export</Button>
          </>
        }
      />

      <SectionNav label="Accounting sections" items={ACCOUNTING_SECTIONS} className="mt-5" />

      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 sm:grid-cols-4">
        <StatTile
          label="Revenue"
          value={headline.revenue}
          kind="money"
          places={0}
          detail={`+${headline.revenueChange}% vs prev. 6 mo`}
        />
        <StatTile
          label="Cost of goods"
          value={headline.cogs}
          kind="money"
          places={0}
          detail={`+${headline.cogsChange}% vs prev. 6 mo`}
        />
        <StatTile
          label="Operating expenses"
          value={headline.opex}
          kind="money"
          places={0}
          detail={`+${headline.opexChange}% vs prev. 6 mo`}
        />
        <StatTile
          label="Net income"
          value={headline.netIncome}
          kind="money"
          places={0}
          detail={`+${headline.netIncomeChange}% vs prev. 6 mo`}
        />
      </dl>

      <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="Revenue, cost and margin"
          description="Revenue, cost of goods and operating expenses in dollars, with net margin as a percentage below"
          height={240}
          series={[
            ...DOLLAR_SERIES,
            { key: 'netMargin', label: 'Net margin %', color: chartColor.highlight, shape: 'line' },
          ]}
          table={{
            caption: 'Revenue, cost, operating expenses and net margin by period',
            categoryLabel: 'Period',
            categories: data.map((point) => point.label),
            rows: [
              { key: 'revenue', label: 'Revenue', values: data.map((p) => String(p.revenue)) },
              { key: 'cogs', label: 'Cost of goods', values: data.map((p) => String(p.cogs)) },
              { key: 'opex', label: 'Operating expenses', values: data.map((p) => String(p.opex)) },
              { key: 'netMargin', label: 'Net margin %', values: data.map((p) => `${p.netMargin}%`) },
            ],
          }}
        >
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <ComparisonBars
                data={data}
                series={DOLLAR_SERIES}
                format={(value) => compactMoney(String(value))}
                activeIndex={hover.activeIndex}
                onActiveIndexChange={hover.setActiveIndex}
              />
            </div>
            <div className="h-20 shrink-0">
              <TrendLine
                data={data.map((point) => ({ label: point.label, value: point.netMargin }))}
                color={chartColor.highlight}
                format={(value) => `${value}%`}
                showCategories={false}
                activeIndex={hover.activeIndex}
                onActiveIndexChange={hover.setActiveIndex}
              />
            </div>
          </div>
        </ChartCard>

        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="section-label">Receivables aging</h2>
            <Figure value={receivablesAging.total} className="text-md" />
          </div>

          <div className="mt-4">
            <SegmentBar
              caption="Receivables by age bucket"
              segments={receivablesAging.buckets.map((bucket, index) => ({
                key: bucket.key,
                label: bucket.label,
                value: bucket.value,
                share: bucket.share,
                color: AGING_COLORS[index],
              }))}
            />
          </div>

          <button
            type="button"
            aria-disabled="true"
            title="Not wired up yet"
            className="mt-4 text-base text-accent"
          >
            Send reminders for {receivablesAging.overdue} overdue →
          </button>
        </section>
      </div>

      {active && (
        <div className="sr-only" role="status">
          {active.label}: revenue {active.revenue}, net margin {active.netMargin}%
        </div>
      )}

      <section className="mt-9">
        <Table>
          <ColumnHeaders>
            <Th className="pl-3">USD</Th>
            {statementColumns.map((column) => (
              <Th key={column} align="right">
                {column}
              </Th>
            ))}
          </ColumnHeaders>
          <TBody>
            {statement.map((row) => (
              <Tr key={row.id}>
                <Td className={cn('pl-3', row.emphasis && 'font-medium')}>{row.label}</Td>
                {row.values.map((value, index) => (
                  <Td
                    key={statementColumns[index]}
                    align="right"
                    className={cn(index === row.values.length - 1 && 'bg-raised')}
                  >
                    <Figure value={value} places={0} tone={row.emphasis ? 'default' : 'muted'} />
                  </Td>
                ))}
              </Tr>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  )
}
