import { Figure } from '@/core/components/ui/Figure'
import { riseAt } from '@/core/lib/motion'
import { cn } from '@/core/lib/cn'
import { metrics } from '../fixtures/metrics'

export interface MetricStripProps {
  fresh?: boolean
}

export function MetricStrip({ fresh = false }: MetricStripProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-10 gap-y-7 border-y border-line py-7 sm:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={cn(fresh && 'rise', 'flex flex-col gap-1.5')}
          style={fresh ? riseAt(index + 3) : undefined}
        >
          <dt className="section-label">{metric.label}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
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
