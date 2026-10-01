import type { ReactNode } from 'react'
import { cn } from '@/core/lib/cn'
import { ChartLegend, type SeriesMeta } from './ChartLegend'

export interface ChartDataTable {
  caption: string
  categoryLabel: string
  categories: string[]
  rows: { key: string; label: string; values: string[] }[]
}

export interface ChartCardProps {
  title: string
  description: string
  series: SeriesMeta[]
  table: ChartDataTable
  controls?: ReactNode
  figures?: ReactNode
  height?: number
  className?: string
  children: ReactNode
}

function HiddenTable({ table }: { table: ChartDataTable }) {
  return (
    <table className="sr-only">
      <caption>{table.caption}</caption>
      <thead>
        <tr>
          <th scope="col">{table.categoryLabel}</th>
          {table.rows.map((row) => (
            <th key={row.key} scope="col">
              {row.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.categories.map((category, index) => (
          <tr key={category}>
            <th scope="row">{category}</th>
            {table.rows.map((row) => (
              <td key={row.key}>{row.values[index] ?? ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ChartCard({
  title,
  description,
  series,
  table,
  controls,
  figures,
  height = 260,
  className,
  children,
}: ChartCardProps) {
  return (
    <section className={cn('rounded-card border border-line bg-surface p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <p className="section-label">{title}</p>
        {controls}
      </div>

      {figures && <div className="mt-2 flex items-baseline gap-2.5">{figures}</div>}

      <div className="mt-3">
        <ChartLegend series={series} />
      </div>

      <div className="mt-3" style={{ height }} role="img" aria-label={description}>
        {children}
      </div>

      <HiddenTable table={table} />
    </section>
  )
}
