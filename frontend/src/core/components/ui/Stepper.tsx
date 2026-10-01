import { cn } from '@/core/lib/cn'
import { Icon } from './Icon'

export interface StepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  label: string
  className?: string
}

export function Stepper({ value, max, onChange, label, className }: StepperProps) {
  const clamp = (next: number) => onChange(Math.min(max, Math.max(0, next)))

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => clamp(value - 1)}
        className="flex size-6 items-center justify-center rounded-control border border-line-strong text-ink-muted transition-colors duration-140 hover:bg-raised hover:text-ink"
      >
        <Icon name="minus" className="size-3" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value.replace(/\D/g, ''))
          clamp(Number.isFinite(next) ? next : 0)
        }}
        className="figure h-6 w-12 rounded-control border border-line-strong bg-surface text-center text-base focus:border-accent focus:outline-none"
      />

      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => clamp(value + 1)}
        className="flex size-6 items-center justify-center rounded-control border border-line-strong text-ink-muted transition-colors duration-140 hover:bg-raised hover:text-ink"
      >
        <Icon name="plus" className="size-3" />
      </button>
    </div>
  )
}
