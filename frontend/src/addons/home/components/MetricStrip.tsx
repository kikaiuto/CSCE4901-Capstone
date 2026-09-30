import { Figure } from '@/core/components/ui/Figure'
import type { FigureKind } from '@/core/components/ui/Figure'

interface Metric {
  label: string
  value: string
  kind: FigureKind
  places?: number
  delta?: string
  deltaKind?: FigureKind
}

const METRICS: Metric[] = [
  { label: 'Revenue · 12w', value: '127800', kind: 'money', places: 0, delta: '15.2', deltaKind: 'percent' },
  { label: 'Gross margin', value: '34.2', kind: 'percent', delta: '1.1', deltaKind: 'decimal' },
  { label: 'Open orders', value: '23', kind: 'quantity' },
  { label: 'Receivables', value: '12940', kind: 'decimal', places: 0, delta: '-2.3', deltaKind: 'percent' },
]

export function MetricStrip() {
  return (
    <dl className="grid grid-cols-2 gap-x-10 gap-y-7 border-y border-line py-7 sm:grid-cols-4">
      {METRICS.map((metric, index) => (
        <div
          key={metric.label}
          className={`animate-rise stagger-${index + 3} flex flex-col gap-1.5`}
        >
          <dt className="section-label">{metric.label}</dt>
          <dd className="flex items-baseline gap-2.5">
            <Figure
              value={metric.value}
              kind={metric.kind}
              places={metric.places}
              className="text-2xl tracking-tight"
            />
            {metric.delta && (
              <Figure
                value={metric.delta}
                kind={metric.deltaKind}
                sign="always"
                tone="signed"
                className="text-xs"
              />
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
