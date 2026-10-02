import { cn } from '@/core/lib/cn'
import type { SideEffect } from '../fixtures/orders'

export interface SideEffectListProps {
  steps: SideEffect[]
}

export function SideEffectList({ steps }: SideEffectListProps) {
  return (
    <ol className="mt-3 space-y-5">
      {steps.map((step, index) => (
        <li key={step.id} className="relative flex gap-3 pl-0">
          <span className="relative flex w-3 shrink-0 justify-center pt-1.5">
            <span
              aria-hidden
              className={cn(
                'size-2.5 rounded-full border',
                step.done ? 'border-ink bg-ink' : 'border-line-strong bg-surface',
              )}
            />
            {index < steps.length - 1 && (
              <span aria-hidden className="absolute top-5 h-[calc(100%+0.75rem)] w-px bg-line" />
            )}
          </span>

          <div className="min-w-0">
            <p className={cn('text-base', step.done ? 'text-ink' : 'text-ink-muted')}>
              {step.title}
            </p>
            <p className="figure mt-0.5 text-xs text-ink-faint">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
