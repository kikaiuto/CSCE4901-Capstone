import type { ReactNode } from 'react'
import { cn } from '@/core/lib/cn'

export interface EmptyStateProps {
  title: string
  detail?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, detail, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-16 text-center', className)}>
      <p className="text-md text-ink">{title}</p>
      {detail && <p className="max-w-sm text-base text-ink-muted">{detail}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
