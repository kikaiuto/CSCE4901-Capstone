import { cn } from '@/core/lib/cn'

export interface TooltipRow {
  key: string
  label: string
  value: string
  swatch?: string
  dashed?: boolean
}

export interface ChartTooltipProps {
  title: string
  rows: TooltipRow[]
  className?: string
}

export function ChartTooltip({ title, rows, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        'pointer-events-none rounded-control border border-panel-line bg-panel px-3 py-2 shadow-float',
        className,
      )}
    >
      <p className="text-xs font-medium whitespace-nowrap text-panel-ink">{title}</p>
      <dl className="mt-1.5 flex flex-col gap-0.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-6 whitespace-nowrap">
            <dt className="flex items-center gap-1.5 text-xs text-panel-ink-muted">
              {row.swatch && (
                <span
                  aria-hidden="true"
                  className={cn('inline-block h-0.5 w-3 rounded-pill', row.dashed && 'opacity-70')}
                  style={{ backgroundColor: row.swatch }}
                />
              )}
              {row.label}
            </dt>
            <dd className="figure text-xs text-panel-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
