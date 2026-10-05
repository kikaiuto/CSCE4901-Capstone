import { cn } from '@/core/lib/cn'

export interface MeterProps {
  value: number
  max: number
  label: string
  tone?: 'accent' | 'positive' | 'negative'
  className?: string
}

const TONES = {
  accent: 'bg-accent',
  positive: 'bg-positive',
  negative: 'bg-negative',
}

export function Meter({ value, max, label, tone = 'accent', className }: MeterProps) {
  const share = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-1.5 w-full overflow-hidden rounded-pill bg-raised', className)}
    >
      <span
        className={cn('block h-full rounded-pill transition-[width] duration-200', TONES[tone])}
        style={{ width: `${share}%` }}
      />
    </div>
  )
}
