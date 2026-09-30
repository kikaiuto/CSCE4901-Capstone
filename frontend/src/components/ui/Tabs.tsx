import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  id: T
  label: string
  count?: number
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}

export function Tabs<T extends string>({ items, active, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex items-center gap-6 border-b border-line', className)}>
      {items.map((item) => {
        const selected = item.id === active

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-base transition-colors',
              selected
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="figure text-xs text-ink-faint">{item.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
