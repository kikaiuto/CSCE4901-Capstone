import { cn } from '@/core/lib/cn'

export type Status =
  | 'draft'
  | 'confirmed'
  | 'fulfilled'
  | 'cancelled'
  | 'submitted'
  | 'received'
  | 'active'
  | 'invited'
  | 'auto'
  | 'manual'

export interface StatusPillProps {
  status: Status
  label?: string
  className?: string
}

const TONES: Record<Status, string> = {
  draft: 'border-line-strong text-ink-muted',
  confirmed: 'border-accent-line text-accent',
  fulfilled: 'border-positive/55 text-positive',
  cancelled: 'border-negative/55 text-negative',
  submitted: 'border-pending/55 text-pending',
  received: 'border-positive/55 text-positive',
  active: 'border-positive/55 text-positive',
  invited: 'border-pending/55 text-pending',
  auto: 'border-accent-line text-accent',
  manual: 'border-line-strong text-ink-muted',
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'figure inline-flex items-center rounded-pill border px-1.5 py-0.5 text-micro uppercase',
        TONES[status],
        className,
      )}
    >
      {label ?? status}
    </span>
  )
}
