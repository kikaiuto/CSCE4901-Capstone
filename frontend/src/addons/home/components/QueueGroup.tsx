import { Button } from '@/core/components/ui/Button'
import { Figure } from '@/core/components/ui/Figure'
import type { QueueGroup as QueueGroupData, QueueItem } from '@/addons/home/fixtures/queue'
import { riseAt } from '@/core/lib/motion'
import { cn } from '@/core/lib/cn'

function Row({ item }: { item: QueueItem }) {
  return (
    <div className="group -mx-3 flex items-center gap-5 rounded-control px-3 py-3.5 transition-colors duration-150 hover:bg-raised/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-md">{item.title}</p>
        <p className="mt-0.5 truncate text-sm text-ink-faint">{item.detail}</p>
      </div>

      {item.amount && (
        <Figure
          value={item.amount}
          kind="money"
          tone={item.amountTone === 'negative' ? 'negative' : 'muted'}
          className="text-base"
        />
      )}

      {item.ratio && (
        <p className="text-base">
          <Figure value={item.ratio.have} kind="quantity" tone="negative" />
          <span className="px-1 text-ink-faint">/</span>
          <Figure value={item.ratio.need} kind="quantity" tone="faint" />
        </p>
      )}

      <Button
        variant={item.primary ? 'ink' : 'secondary'}
        size="sm"
        unwired
        className="w-24 justify-center opacity-70 transition-opacity duration-150 group-hover:opacity-100"
      >
        {item.action}
      </Button>
    </div>
  )
}

export interface QueueGroupProps {
  group: QueueGroupData
  index: number
  fresh?: boolean
}

export function QueueGroup({ group, index, fresh = false }: QueueGroupProps) {
  return (
    <section className={cn(fresh && 'rise')} style={fresh ? riseAt(index + 7) : undefined}>
      <div className="flex items-baseline justify-between border-b border-line pb-2">
        <h2 className="section-label">{group.label}</h2>
        <span className="figure text-micro text-ink-faint">{group.items.length}</span>
      </div>

      <div className="divide-y divide-line">
        {group.items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
